"""
Authentication module — JWT-based login / register / token verification.

Uses only Python stdlib for JWT (HS256) and password hashing (PBKDF2-SHA256)
so there are zero extra dependencies to install.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth")

_bearer_scheme = HTTPBearer(auto_error=False)


def _config() -> tuple[str, str, str, str]:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    secret = os.getenv("SECRET_KEY", "change-me-in-production")
    return url, key, f"{url}/rest/v1", secret


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict[str, Any], secret: str, exp_hours: int = 72) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {**payload, "iat": now, "exp": now + exp_hours * 3600}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def verify_jwt(token: str, secret: str) -> dict[str, Any] | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected_sig, _b64url_decode(sig_b64)):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


_ITERATIONS = 260_000
_SALT_BYTES = 16
_HASH_BYTES = 32


def hash_password(plain: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, _ITERATIONS, dklen=_HASH_BYTES)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    if "$" in stored:
        salt_hex, hash_hex = stored.split("$", 1)
        dk = hashlib.pbkdf2_hmac(
            "sha256", plain.encode(), bytes.fromhex(salt_hex), _ITERATIONS, dklen=_HASH_BYTES
        )
        return hmac.compare_digest(dk, bytes.fromhex(hash_hex))
    return plain == stored


def _headers(service_key: str, *, prefer: str = "return=representation") -> dict[str, str]:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def _rest(
    method: str,
    path: str,
    *,
    rest_base: str,
    service_key: str,
    body: dict[str, Any] | list[dict[str, Any]] | None = None,
    prefer: str = "return=representation",
) -> Any:
    url = f"{rest_base}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, headers=_headers(service_key, prefer=prefer), method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise HTTPException(status_code=exc.code, detail=detail) from exc


class LoginPayload(BaseModel):
    email: str
    password: str


class RegisterPayload(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "candidate"


def _normalize_candidate_record(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "full_name": row.get("full_name") or row.get("name") or "",
        "email": row.get("email") or "",
        "location": row.get("location") or row.get("current_location") or "",
        "role": row.get("role") or "candidate",
        "password": row.get("password") or row.get("hashed_password") or "",
    }


def _lookup_account_by_email(email: str, *, rest_base: str, service_key: str) -> dict[str, Any] | None:
    encoded_email = urllib.parse.quote(email, safe="")
    for table in ("profiles", "candidates", "Candidates"):
        try:
            rows = _rest(
                "GET",
                f"/{table}?email=eq.{encoded_email}&select=*&limit=1",
                rest_base=rest_base,
                service_key=service_key,
            )
        except HTTPException:
            continue
        if isinstance(rows, list) and rows:
            return _normalize_candidate_record(rows[0])
    return None


def _find_user_by_id(candidate_id: str, *, rest_base: str, service_key: str) -> dict[str, Any] | None:
    for table in ("profiles", "candidates", "Candidates"):
        try:
            rows = _rest(
                "GET",
                f"/{table}?id=eq.{urllib.parse.quote(str(candidate_id), safe='')}&select=*&limit=1",
                rest_base=rest_base,
                service_key=service_key,
            )
        except HTTPException:
            continue
        if isinstance(rows, list) and rows:
            return _normalize_candidate_record(rows[0])
    return None


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    _, _, _, secret = _config()
    payload = verify_jwt(credentials.credentials, secret)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token — please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = await get_current_user_optional(credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(payload: LoginPayload) -> dict[str, Any]:
    supabase_url, service_key, rest_base, secret = _config()
    if not supabase_url or not service_key:
        raise HTTPException(500, "Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Please provide a valid email address.")

    candidate = _lookup_account_by_email(email, rest_base=rest_base, service_key=service_key)
    if not candidate:
        raise HTTPException(404, "Account not found. Please create an account first.")

    db_password = candidate.get("password", "")
    if not db_password:
        raise HTTPException(401, "This account has no password set. Please contact support.")
    if not payload.password:
        raise HTTPException(400, "Password is required.")
    if not verify_password(payload.password, db_password):
        raise HTTPException(401, "Incorrect password. Please try again.")

    token_payload = {
        "sub": str(candidate["id"]),
        "email": candidate.get("email", email),
        "name": candidate.get("full_name", ""),
        "role": candidate.get("role", "candidate"),
    }
    token = create_jwt(token_payload, secret)
    safe_candidate = {k: v for k, v in candidate.items() if k != "password"}

    return {"status": "success", "message": "Signed in successfully.", "token": token, "candidate": safe_candidate}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterPayload) -> dict[str, Any]:
    supabase_url, service_key, rest_base, secret = _config()
    if not supabase_url or not service_key:
        raise HTTPException(500, "Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Please provide a valid email address.")

    password = payload.password.strip()
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    if _lookup_account_by_email(email, rest_base=rest_base, service_key=service_key):
        raise HTTPException(400, "An account with this email already exists. Please sign in.")

    hashed = hash_password(password)
    now = datetime.now(timezone.utc).isoformat()
    candidate_record = {
        "full_name": payload.full_name.strip() or "Candidate",
        "email": email,
        "role": payload.role or "candidate",
        "created_at": now,
        "updated_at": now,
    }
    created = None
    for table, extra in (("Candidates", {"password": hashed}), ("profiles", {})):
        try:
            body = {**candidate_record, **extra}
            created = _rest("POST", f"/{table}", body=body, rest_base=rest_base, service_key=service_key)
            if created:
                break
        except HTTPException:
            continue

    if not created:
        raise HTTPException(500, "Failed to create account in database.")

    row = created[0] if isinstance(created, list) else created
    candidate_id = row.get("id")

    if payload.role == "recruiter":
        try:
            recruiter_body = {
                "id": candidate_id,
                "full_name": candidate_record["full_name"],
                "email": candidate_record["email"]
            }
            _rest("POST", "/recruiters", body=recruiter_body, rest_base=rest_base, service_key=service_key, prefer="return=minimal")
        except Exception:
            # Non-fatal if this fails, they can still login
            pass

    row = created[0] if isinstance(created, list) else created
    token_payload = {
        "sub": str(row.get("id")),
        "email": row.get("email", email),
        "name": row.get("full_name", ""),
        "role": row.get("role", "candidate"),
    }
    token = create_jwt(token_payload, secret)
    safe_candidate = {k: v for k, v in row.items() if k != "password"}
    return {"status": "created", "message": "Account created successfully.", "token": token, "candidate": safe_candidate}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base, _ = _config()
    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        return {"id": None, "name": user.get("name", "User"), "email": user.get("email", ""), "role": user.get("role", "candidate")}

    candidate = _find_user_by_id(candidate_id, rest_base=rest_base, service_key=service_key)
    if candidate:
        return {
            "id": candidate.get("id"),
            "name": candidate.get("full_name", ""),
            "email": candidate.get("email", ""),
            "location": candidate.get("location", ""),
            "role": candidate.get("role", "candidate"),
        }
    return {"id": candidate_id, "name": user.get("name", "User"), "email": user.get("email", ""), "role": user.get("role", "candidate")}


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_token(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return {"valid": True, "email": user.get("email", ""), "sub": user.get("sub", "")}
