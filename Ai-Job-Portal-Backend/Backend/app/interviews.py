from __future__ import annotations

import urllib.parse
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from .auth import get_current_user, get_current_user_optional
from .looking_for import _config, _rest

router = APIRouter(prefix="/api")


class SavedJobPayload(BaseModel):
    job_id: str

class InterviewCreatePayload(BaseModel):
    application_id: str
    stage: str
    scheduled_at: str | None = None
    duration_minutes: int = 30
    location_or_link: str | None = None

class InterviewStatusPayload(BaseModel):
    status: str


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


def _candidate_id_from_user(user: dict[str, Any] | None) -> str:
    if not user:
        return ""
    return str(user.get("sub", ""))


@router.get("/candidate/interviews")
def list_candidate_interviews(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    candidate_id = _candidate_id_from_user(user)
    if not candidate_id:
        raise HTTPException(401, "Not authenticated — please sign in.")

    _, service_key, rest_base = _config()
    rows = _rest("GET", "/applications?candidate_id=eq.{candidate_id}&select=id".format(candidate_id=urllib.parse.quote(candidate_id, safe='')),
                 rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return []
    application_ids = {str(row.get("id")) for row in rows if row.get("id") is not None}
    if not application_ids:
        return []

    interview_rows = _rest("GET", "/interviews?select=*", rest_base=rest_base, service_key=service_key)
    if not isinstance(interview_rows, list):
        return []

    out = []
    for row in interview_rows:
        if str(_first(row, "application_id", default="")) not in application_ids:
            continue
        out.append({
            "id": str(_first(row, "id", default="")),
            "jobId": str(_first(row, "job_id", "jobId", default="")),
            "stage": _first(row, "stage", default="interview"),
            "at": _first(row, "scheduled_at", "at", "interview_at", default=""),
            "duration": _first(row, "duration", "duration_minutes", default=30),
            "interviewers": _list(_first(row, "interviewers", "interviewer_names", default=[])),
            "mode": _first(row, "mode", "interview_mode", default="Video interview"),
            "status": _first(row, "status", default="scheduled"),
        })
    return out


@router.get("/candidate/saved-jobs")
def list_saved_jobs(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    candidate_id = _candidate_id_from_user(user)
    if not candidate_id:
        raise HTTPException(401, "Not authenticated — please sign in.")

    _, service_key, rest_base = _config()
    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
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
            "savedAt": _first(row, "saved_at", "created_at", "savedAt", default=""),
        })
    return saved


@router.get("/candidate/saved-jobs/{job_id}")
def is_job_saved(job_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, bool]:
    candidate_id = _candidate_id_from_user(user)
    if not candidate_id:
        raise HTTPException(401, "Not authenticated — please sign in.")

    _, service_key, rest_base = _config()
    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return {"saved": False}

    for row in rows:
        if str(_first(row, "candidate_id", "user_id", "candidateId", "userId")) == candidate_id and str(_first(row, "job_id", "jobId")) == job_id:
            return {"saved": True}
    return {"saved": False}


@router.post("/candidate/saved-jobs", status_code=status.HTTP_201_CREATED)
def save_job(payload: SavedJobPayload, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    candidate_id = _candidate_id_from_user(user)
    if not candidate_id or not payload.job_id.strip():
        raise HTTPException(400, "Authenticated candidate and job are required")

    _, service_key, rest_base = _config()
    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
    if isinstance(rows, list):
        for row in rows:
            if str(_first(row, "candidate_id", "user_id", "candidateId", "userId")) == candidate_id and str(_first(row, "job_id", "jobId")) == payload.job_id:
                return {"job_id": payload.job_id, "saved": True, "candidate_id": candidate_id}

    body = {"candidate_id": candidate_id, "job_id": payload.job_id, "saved_at": __import__('datetime').datetime.utcnow().isoformat() + 'Z'}
    created = _rest("POST", "/saved_jobs", rest_base=rest_base, service_key=service_key, body=body)
    if isinstance(created, list) and created:
        return created[0]
    return {"job_id": payload.job_id, "saved": True, "candidate_id": candidate_id}


@router.delete("/candidate/saved-jobs/{job_id}")
def unsave_job(job_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, bool]:
    candidate_id = _candidate_id_from_user(user)
    if not candidate_id:
        raise HTTPException(401, "Not authenticated — please sign in.")

    _, service_key, rest_base = _config()
    rows = _rest("GET", "/saved_jobs?select=*", rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return {"ok": True}

    for row in rows:
        if str(_first(row, "candidate_id", "user_id", "candidateId", "userId")) != candidate_id:
            continue
        if str(_first(row, "job_id", "jobId")) != job_id:
            continue
        row_id = _first(row, "id")
        if row_id is not None:
            _rest("DELETE", f"/saved_jobs?id=eq.{urllib.parse.quote(str(row_id), safe='')}", rest_base=rest_base, service_key=service_key, prefer="return=minimal")
    return {"ok": True}

@router.post("/interviews", status_code=status.HTTP_201_CREATED)
def create_interview(payload: InterviewCreatePayload, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    # In a real app, verify user is a recruiter who owns the job associated with the application.
    recruiter_id = _candidate_id_from_user(user)
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    _, service_key, rest_base = _config()
    
    body = {
        "application_id": payload.application_id,
        "stage": payload.stage,
        "scheduled_at": payload.scheduled_at,
        "duration_minutes": payload.duration_minutes,
        "location_or_link": payload.location_or_link,
        "status": "scheduled"
    }
    
    created = _rest("POST", "/interviews", rest_base=rest_base, service_key=service_key, body=body)
    if isinstance(created, list) and created:
        return created[0]
    return body

@router.get("/interviews/recruiter")
def list_recruiter_interviews(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    # In a real app, only return interviews for jobs this recruiter owns.
    recruiter_id = _candidate_id_from_user(user)
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    _, service_key, rest_base = _config()
    
    # For now, just fetch all interviews since we are mocking auth rules in the backend
    interview_rows = _rest("GET", "/interviews?select=*", rest_base=rest_base, service_key=service_key)
    if not isinstance(interview_rows, list):
        return []
        
    out = []
    for row in interview_rows:
        out.append({
            "id": str(_first(row, "id", default="")),
            "applicationId": str(_first(row, "application_id", default="")),
            "jobId": "j1", # Mocked for now
            "candidateId": "c1", # Mocked for now
            "candidateName": "Applicant", # Mocked for now
            "stage": _first(row, "stage", default="interview"),
            "at": _first(row, "scheduled_at", "at", "interview_at", default=""),
            "duration": _first(row, "duration", "duration_minutes", default=30),
            "interviewers": _list(_first(row, "interviewers", "interviewer_names", default=["Recruiter"])),
            "mode": _first(row, "mode", "location_or_link", default="Video interview"),
            "status": _first(row, "status", default="scheduled"),
            "feedbackDue": _first(row, "status") == "confirmed",
        })
    return out

@router.patch("/interviews/{interview_id}/status")
def update_interview_status(interview_id: str, payload: InterviewStatusPayload, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    recruiter_id = _candidate_id_from_user(user)
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    _, service_key, rest_base = _config()
    
    body = {"status": payload.status}
    updated = _rest("PATCH", f"/interviews?id=eq.{urllib.parse.quote(interview_id, safe='')}", 
                    rest_base=rest_base, service_key=service_key, body=body)
                    
    return {"ok": True, "status": payload.status}
