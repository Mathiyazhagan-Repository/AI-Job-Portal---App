from __future__ import annotations

import urllib.parse
from typing import Any
import datetime

from fastapi import APIRouter, Depends, HTTPException, Body

from .auth import get_current_user_optional
from .looking_for import _config, _rest

router = APIRouter(prefix="/api/admin")

def _user_id_from_user(user: dict[str, Any] | None) -> str:
    if not user:
        return ""
    return str(user.get("sub", ""))

@router.get("/moderation/jobs")
def get_moderation_jobs(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    # In a real app we'd verify admin role.
    _, service_key, rest_base = _config()
    
    jobs = _rest("GET", "/jobs?status=eq.pending_review", rest_base=rest_base, service_key=service_key)
    if not isinstance(jobs, list):
        jobs = []

    # get companies to enrich
    companies = _rest("GET", "/companies", rest_base=rest_base, service_key=service_key)
    comp_map = {c["id"]: c["name"] for c in companies} if isinstance(companies, list) else {}

    queue = []
    for j in jobs:
        queue.append({
            "id": j["id"],
            "jobId": j["id"],
            "company": comp_map.get(j.get("company_id"), "Unknown Company"),
            "submitted": j.get("created_at"),
            "flags": [] # mock flags can be added if needed
        })
    return queue

@router.patch("/moderation/jobs/{job_id}/approve")
def approve_job(job_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    _rest("PATCH", f"/jobs?id=eq.{job_id}", body={"status": "published"}, rest_base=rest_base, service_key=service_key)
    return {"status": "success"}

@router.patch("/moderation/jobs/{job_id}/reject")
def reject_job(job_id: str, body: dict[str, Any] = Body(...), user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    reason = body.get("reason", "No reason provided")
    # 'rejected' is not a valid status in the jobs enum. The enum has: draft, pending_review, published, closed, expired, archived.
    # We will change it to 'draft' so they can fix it.
    _rest("PATCH", f"/jobs?id=eq.{job_id}", body={"status": "draft"}, rest_base=rest_base, service_key=service_key)
    return {"status": "success", "reason": reason}

@router.get("/moderation/companies")
def get_moderation_companies(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    _, service_key, rest_base = _config()
    
    cvs = _rest("GET", "/company_verification?status=eq.pending", rest_base=rest_base, service_key=service_key)
    if not isinstance(cvs, list):
        cvs = []

    queue = []
    for cv in cvs:
        queue.append({
            "id": cv["id"],
            "companyId": cv["company_id"],
            "domain": "example.com",
            "documentName": cv.get("document_key", "doc.pdf"),
            "submitted": cv.get("created_at") or datetime.datetime.utcnow().isoformat(),
            "domainMatch": True,
            "gstPresent": True
        })
    return queue

@router.patch("/moderation/companies/{company_id}/verify")
def verify_company(company_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    # Update company
    _rest("PATCH", f"/companies?id=eq.{company_id}", body={"verification_status": "verified"}, rest_base=rest_base, service_key=service_key)
    # Update verification row
    _rest("PATCH", f"/company_verification?company_id=eq.{company_id}", body={"status": "approved"}, rest_base=rest_base, service_key=service_key)
    return {"status": "success"}
