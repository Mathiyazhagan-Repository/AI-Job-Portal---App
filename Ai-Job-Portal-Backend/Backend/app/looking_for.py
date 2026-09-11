"""
POST /api/looking-for  –  upsert a candidate's "looking for" preferences.

Uses the SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS on the looking_for
table (the anon key cannot write because auth.uid() is NULL in the
frontend's unauthenticated onboarding flow).
"""
from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from .auth import get_current_user

router = APIRouter(prefix="/api")

def _config() -> tuple[str, str, str]:
    """Read Supabase config lazily (after load_dotenv has run in main.py)."""
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return url, key, f"{url}/rest/v1"


# ── helpers ──────────────────────────────────────────────────────────────

def _headers(service_key: str, *, prefer: str = "return=representation") -> dict[str, str]:
    """Standard headers for Supabase REST (PostgREST) using service-role."""
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
    """Tiny wrapper around urllib to talk to Supabase REST."""
    url = f"{rest_base}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=_headers(service_key, prefer=prefer), method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise HTTPException(status_code=exc.code, detail=detail) from exc


# ── request schema ───────────────────────────────────────────────────────

class LookingForPayload(BaseModel):
    email: str
    candidate_name: str = ""
    roles: list[str] = Field(default_factory=list)
    minimum_salary_lakhs: int = 28
    work_modes: list[str] = Field(default_factory=list)
    job_types: list[str] = Field(default_factory=list)
    availability: str = "In 30 days"


class CandidateProfileUpdate(BaseModel):
    authoritative_email: str | None = None
    parsed_email: str | None = None
    full_name: str | None = None
    location: str | None = None


@router.post("/looking-for")
def save_looking_for(payload: LookingForPayload) -> dict[str, Any]:
    """Create or update a candidate's job-search preferences."""
    supabase_url, service_key, rest_base = _config()
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

    now = datetime.now(timezone.utc).isoformat()
    values = {
        "email": email,
        "candidate_name": payload.candidate_name.strip(),
        "roles": payload.roles,
        "minimum_salary_lakhs": payload.minimum_salary_lakhs,
        "work_modes": payload.work_modes,
        "job_types": payload.job_types,
        "availability": payload.availability,
        "updated_at": now,
    }

    encoded_email = urllib.parse.quote(email, safe="")
    existing = _rest(
        "GET",
        f"/looking_for?email=eq.{encoded_email}&select=id&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )

    if existing:
        record_id = urllib.parse.quote(str(existing[0]["id"]), safe="")
        saved = _rest(
            "PATCH",
            f"/looking_for?id=eq.{record_id}",
            rest_base=rest_base,
            service_key=service_key,
            body=values,
        )
    else:
        values["created_at"] = now
        saved = _rest(
            "POST",
            "/looking_for",
            rest_base=rest_base,
            service_key=service_key,
            body=values,
        )

    return saved[0] if isinstance(saved, list) and saved else values


@router.get("/candidate/profile")
def get_candidate_profile(email: str) -> dict[str, Any]:
    """Return the candidate profile used by the frontend profile store."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    normalized_email = email.strip().lower()
    if not normalized_email or "@" not in normalized_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    encoded_email = urllib.parse.quote(normalized_email, safe="")
    candidates = _rest(
        "GET",
        f"/Candidates?email=eq.{encoded_email}&select=id,full_name,email,location,role&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )

    if not candidates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    candidate = candidates[0]
    return {
        "id": candidate.get("id"),
        "name": candidate.get("full_name", ""),
        "email": candidate.get("email", normalized_email),
        "location": candidate.get("location") or "",
        "role": candidate.get("role", "candidate"),
    }


@router.patch("/candidate/profile")
def update_candidate_profile(payload: CandidateProfileUpdate) -> dict[str, Any]:
    """Update parsed profile fields without changing the account email."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    authoritative_email = (payload.authoritative_email or "").strip().lower()
    parsed_email = (payload.parsed_email or "").strip().lower()
    lookup_email = authoritative_email or parsed_email
    if not lookup_email or "@" not in lookup_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An authoritative or parsed email is required to identify the candidate.",
        )

    encoded_email = urllib.parse.quote(lookup_email, safe="")
    candidates = _rest(
        "GET",
        f"/Candidates?email=eq.{encoded_email}&select=id,full_name,email,location,role&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )
    if not candidates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    candidate = candidates[0]
    candidate_update: dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.full_name and payload.full_name.strip():
        candidate_update["full_name"] = payload.full_name.strip()
    if payload.location and payload.location.strip():
        candidate_update["location"] = payload.location.strip()

    # Deliberately never include an email key: Candidates.email is authoritative.
    updated = _rest(
        "PATCH",
        f"/Candidates?id=eq.{urllib.parse.quote(str(candidate['id']), safe='')}",
        rest_base=rest_base,
        service_key=service_key,
        body=candidate_update,
    )
    saved = updated[0] if isinstance(updated, list) and updated else {**candidate, **candidate_update}
    saved["name"] = saved.get("full_name", "")
    return saved


@router.get("/candidate/applications/count")
def get_application_count(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, int]:
    """Return the application count for the authenticated candidate."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        return {"count": 0}

    encoded_id = urllib.parse.quote(candidate_id, safe="")
    applications = _rest(
        "GET",
        f"/applications?candidate_id=eq.{encoded_id}&select=id",
        rest_base=rest_base,
        service_key=service_key,
    )
    return {"count": len(applications) if isinstance(applications, list) else 0}



class LoginPayload(BaseModel):
    email: str
    password: str = ""


class RegisterPayload(BaseModel):
    full_name: str
    email: str
    password: str = ""
    role: str = "candidate"


