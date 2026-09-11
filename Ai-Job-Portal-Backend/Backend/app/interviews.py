from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from .auth import get_current_user
from .looking_for import _config, _rest

router = APIRouter(prefix="/api")


class SavedJobPayload(BaseModel):
    job_id: str


def _first(row: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if row.get(name) is not None:
            return row[name]
    return default


def _list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str) and value.strip():
        return [value]
    return []


@router.get("/candidate/interviews")
def list_candidate_interviews(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    """Return interviews belonging only to the authenticated candidate."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        return []

    rows = _rest(
        "GET",
        f"/interviews?candidate_id=eq.{candidate_id}&select=*",
        rest_base=rest_base,
        service_key=service_key,
    )
    if not isinstance(rows, list):
        return []

    return [
        {
            "id": str(_first(row, "id", default="")),
            "jobId": str(_first(row, "job_id", "jobId", default="")),
            "stage": _first(row, "stage", default="interview"),
            "at": _first(row, "scheduled_at", "at", "interview_at", default=""),
            "duration": _first(row, "duration", "duration_minutes", default=30),
            "interviewers": _list(_first(row, "interviewers", "interviewer_names", default=[])),
            "mode": _first(row, "mode", "interview_mode", default="Video interview"),
            "status": _first(row, "status", default="scheduled"),
        }
        for row in rows
    ]


@router.get("/candidate/saved-jobs")
def list_saved_jobs(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    """Return saved-job references belonging only to the authenticated user."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        return []

    rows = _rest(
        "GET",
        "/saved_jobs?select=*",
        rest_base=rest_base,
        service_key=service_key,
    )
    if not isinstance(rows, list):
        return []

    saved = []
    for row in rows:
        owner_id = _first(row, "candidate_id", "user_id", "candidateId", "userId")
        if str(owner_id) != candidate_id:
            continue
        saved.append({
            "id": str(_first(row, "id", default="")),
            "jobId": str(_first(row, "job_id", "jobId", default="")),
            "savedAt": _first(row, "created_at", "saved_at", "savedAt", default=""),
        })
    return saved


@router.post("/candidate/saved-jobs", status_code=status.HTTP_201_CREATED)
def save_job(payload: SavedJobPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Save a job for the authenticated candidate without duplicates."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(status_code=500, detail="Server misconfigured: missing Supabase service key")
    candidate_id = str(user.get("sub", ""))
    if not candidate_id or not payload.job_id.strip():
        raise HTTPException(status_code=400, detail="Candidate and job are required")

    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
    owner_column = "user_id"
    for row in rows if isinstance(rows, list) else []:
        if str(_first(row, "candidate_id", "user_id", "candidateId", "userId")) == candidate_id and str(_first(row, "job_id", "jobId")) == payload.job_id:
            return row
        if "candidate_id" in row:
            owner_column = "candidate_id"

    try:
        created = _rest(
            "POST",
            "/saved_jobs",
            rest_base=rest_base,
            service_key=service_key,
            body={owner_column: candidate_id, "job_id": payload.job_id},
        )
    except HTTPException as exc:
        # Some projects created this table with candidate_id instead of user_id.
        if owner_column != "user_id" or exc.status_code not in {400, 404}:
            raise
        created = _rest(
            "POST",
            "/saved_jobs",
            rest_base=rest_base,
            service_key=service_key,
            body={"candidate_id": candidate_id, "job_id": payload.job_id},
        )
    return created[0] if isinstance(created, list) and created else {"job_id": payload.job_id}


@router.delete("/candidate/saved-jobs/{job_id}")
def unsave_job(job_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, bool]:
    """Remove only the authenticated candidate's saved job."""
    _, service_key, rest_base = _config()
    candidate_id = str(user.get("sub", ""))
    if not service_key or not candidate_id:
        raise HTTPException(status_code=400, detail="Authenticated candidate is required")
    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
    for row in rows if isinstance(rows, list) else []:
        if str(_first(row, "candidate_id", "user_id", "candidateId", "userId")) != candidate_id:
            continue
        if str(_first(row, "job_id", "jobId")) != job_id:
            continue
        row_id = _first(row, "id")
        if row_id is not None:
            _rest(
                "DELETE",
                f"/saved_jobs?id=eq.{urllib.parse.quote(str(row_id), safe='')}",
                rest_base=rest_base,
                service_key=service_key,
                prefer="return=minimal",
            )
    return {"ok": True}
