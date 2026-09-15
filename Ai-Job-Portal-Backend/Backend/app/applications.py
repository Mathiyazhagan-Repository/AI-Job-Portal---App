from __future__ import annotations

import urllib.parse
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from .auth import get_current_user
from .looking_for import _config, _rest

router = APIRouter(prefix="/api")

class EasyApplyPayload(BaseModel):
    job_id: str
    resume_id: str | None = None

@router.get("/candidate/applications")
def list_candidate_applications(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    _, service_key, rest_base = _config()
    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        raise HTTPException(401, "Not authenticated")
        
    encoded_id = urllib.parse.quote(candidate_id, safe="")
    
    rows = _rest("GET", f"/applications?candidate_id=eq.{encoded_id}&select=*,jobs(*)", rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return []
        
    # Map to frontend expected format
    apps = []
    for row in rows:
        job = row.get("jobs", {})
        if not isinstance(job, dict):
            job = {}
            
        app = {
            "id": row.get("id"),
            "jobId": row.get("job_id"),
            "stage": row.get("status", "applied"),
            "appliedAt": row.get("applied_at"),
            "lastUpdate": row.get("applied_at"), # Simplified for now
            "history": [
                {
                    "stage": row.get("status", "applied"),
                    "at": row.get("applied_at"),
                    "by": "System"
                }
            ],
            "job": {
                "id": job.get("id"),
                "title": job.get("title", "Job Title"),
                "companyId": job.get("company_id", ""),
                "location": job.get("location", ""),
            }
        }
        apps.append(app)
    
    # Sort by appliedAt descending
    apps.sort(key=lambda x: x.get("appliedAt") or "", reverse=True)
    return apps


@router.post("/applications", status_code=status.HTTP_201_CREATED)
def apply_to_job(payload: EasyApplyPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        raise HTTPException(401, "Not authenticated")
        
    # Check if already applied
    encoded_cid = urllib.parse.quote(candidate_id, safe="")
    encoded_jid = urllib.parse.quote(payload.job_id, safe="")
    
    existing = _rest("GET", f"/applications?candidate_id=eq.{encoded_cid}&job_id=eq.{encoded_jid}&select=id", rest_base=rest_base, service_key=service_key)
    if isinstance(existing, list) and len(existing) > 0:
        raise HTTPException(400, "You have already applied to this job.")
        
    now = datetime.now(timezone.utc).isoformat()
    
    body = {
        "job_id": payload.job_id,
        "candidate_id": candidate_id,
        "status": "applied",
        "applied_at": now
    }
    if payload.resume_id:
        body["resume_id"] = payload.resume_id
        
    try:
        created = _rest("POST", "/applications", rest_base=rest_base, service_key=service_key, body=body)
        return {"status": "success", "application": created[0] if isinstance(created, list) and created else created}
    except Exception as e:
        raise HTTPException(500, f"Failed to apply: {str(e)}")

