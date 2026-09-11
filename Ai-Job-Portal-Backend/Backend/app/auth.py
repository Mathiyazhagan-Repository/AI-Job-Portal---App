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

# ── config ───────────────────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)


def _config() -> tuple[str, str, str, str]:
    """Read config lazily (after load_dotenv has run in main.py)."""
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    secret = os.getenv("SECRET_KEY", "change-me-in-production")
    return url, key, f"{url}/rest/v1", secret


# ── JWT helpers (HS256, stdlib only) ─────────────────────────────────────

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict[str, Any], secret: str, exp_hours: int = 72) -> str:
    """Create an HS256 JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {**payload, "iat": now, "exp": now + exp_hours * 3600}

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        secret.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_jwt(token: str, secret: str) -> dict[str, Any] | None:
    """Verify an HS256 JWT token. Returns the payload or None."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts

        signing_input = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(
            secret.encode(), signing_input.encode(), hashlib.sha256
        ).digest()
        actual_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64url_decode(payload_b64))

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


# ── Password hashing (PBKDF2-SHA256, stdlib) ────────────────────────────

_ITERATIONS = 260_000
_SALT_BYTES = 16
_HASH_BYTES = 32


def hash_password(plain: str) -> str:
    """Hash a password with PBKDF2-SHA256. Returns 'salt$hash' hex string."""
    salt = secrets.token_bytes(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, _ITERATIONS, dklen=_HASH_BYTES)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    """Verify a plain password against a stored 'salt$hash' string.

    Also supports legacy plain-text passwords (no '$' separator) for
    backwards compatibility with existing DB rows.
    """
    if "$" in stored:
        # New PBKDF2 format
        salt_hex, hash_hex = stored.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
        dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, _ITERATIONS, dklen=_HASH_BYTES)
        return hmac.compare_digest(dk, expected)
    else:
        # Legacy plain-text password stored in DB
        return plain == stored


# ── Supabase REST helper ────────────────────────────────────────────────

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


# ── Request schemas ─────────────────────────────────────────────────────

class LoginPayload(BaseModel):
    email: str
    password: str


class RegisterPayload(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "candidate"


# ── Dependency: get current user from JWT ────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """FastAPI dependency — extracts and validates the JWT from the
    Authorization header. Returns the token payload or raises 401."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    _, _, _, secret = _config()
    payload = verify_jwt(credentials.credentials, secret)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token — please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


# ── Routes ──────────────────────────────────────────────────────────────

@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(payload: LoginPayload) -> dict[str, Any]:
    """Authenticate a user with email + password. Returns a JWT token."""
    supabase_url, service_key, rest_base, secret = _config()

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        )

    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    # Look up candidate
    encoded_email = urllib.parse.quote(email, safe="")
    candidates = _rest(
        "GET",
        f"/Candidates?email=eq.{encoded_email}&select=id,full_name,email,password,location,role&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )

    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please create an account first.",
        )

    candidate = candidates[0]
    db_password = candidate.get("password", "")
    input_password = payload.password

    # ALWAYS validate the password — no bypasses
    if not db_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has no password set. Please contact support.",
        )

    if not input_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required.",
        )

    if not verify_password(input_password, db_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    # Build JWT token
    token_payload = {
        "sub": str(candidate["id"]),
        "email": candidate.get("email", email),
        "name": candidate.get("full_name", ""),
        "role": candidate.get("role", "candidate"),
    }
    token = create_jwt(token_payload, secret)

    # Don't return password in the response
    safe_candidate = {k: v for k, v in candidate.items() if k != "password"}

    return {
        "status": "success",
        "message": "Signed in successfully.",
        "token": token,
        "candidate": safe_candidate,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterPayload) -> dict[str, Any]:
    """Register a new candidate. Returns a JWT token."""
    supabase_url, service_key, rest_base, secret = _config()

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        )

    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    password = payload.password.strip()
    if not password or len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    # Check if account already exists
    encoded_email = urllib.parse.quote(email, safe="")
    existing = _rest(
        "GET",
        f"/Candidates?email=eq.{encoded_email}&select=id&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in.",
        )

    # Hash the password before storing
    hashed = hash_password(password)

    now = datetime.now(timezone.utc).isoformat()
    new_candidate = {
        "full_name": payload.full_name.strip() or "Candidate",
        "email": email,
        "password": hashed,
        "role": payload.role or "candidate",
        "created_at": now,
        "updated_at": now,
    }

    created = _rest(
        "POST",
        "/Candidates",
        body=new_candidate,
        rest_base=rest_base,
        service_key=service_key,
        prefer="return=representation",
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account in database.",
        )

    candidate = created[0]

    # Build JWT token
    token_payload = {
        "sub": str(candidate["id"]),
        "email": candidate.get("email", email),
        "name": candidate.get("full_name", ""),
        "role": candidate.get("role", "candidate"),
    }
    token = create_jwt(token_payload, secret)

    safe_candidate = {k: v for k, v in candidate.items() if k != "password"}

    return {
        "status": "created",
        "message": "Account created successfully.",
        "token": token,
        "candidate": safe_candidate,
    }


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Returns the authenticated user's profile from the token + DB."""
    supabase_url, service_key, rest_base, _ = _config()

    candidate_id = user.get("sub", "")

    if not candidate_id:
        return {
            "id": None,
            "name": user.get("name", "User"),
            "email": user.get("email", ""),
            "role": user.get("role", "candidate"),
        }

    # Fetch fresh data from DB
    candidates = _rest(
        "GET",
        f"/Candidates?id=eq.{candidate_id}&select=id,full_name,email,location,role&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )

    if candidates:
        c = candidates[0]
        return {
            "id": c.get("id"),
            "name": c.get("full_name", ""),
            "email": c.get("email", ""),
            "location": c.get("location", ""),
            "role": c.get("role", "candidate"),
        }

    # Fallback to token data
    return {
        "id": candidate_id,
        "name": user.get("name", "User"),
        "email": user.get("email", ""),
        "role": user.get("role", "candidate"),
    }


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_token(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Quick check: is the token still valid?"""
    return {"valid": True, "email": user.get("email", ""), "sub": user.get("sub", "")}
