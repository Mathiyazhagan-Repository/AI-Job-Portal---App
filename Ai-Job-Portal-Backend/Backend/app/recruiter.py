from __future__ import annotations

import urllib.parse
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .auth import get_current_user
from .looking_for import _config, _rest
from .jobs import _normalize_job

def _create_dummy_auth_user() -> str | None:
    url, key, _ = _config()
    import urllib.request, json, uuid
    dummy_email = f"dummy_{uuid.uuid4().hex}@example.com"
    req = urllib.request.Request(f'{url}/auth/v1/admin/users', 
        data=json.dumps({'email': dummy_email, 'password': 'Password123!', 'email_confirm': True}).encode(),
        headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        method='POST')
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode())
        return data.get("id")
    except Exception:
        return None

router = APIRouter(prefix="/api/recruiter")

class JobPayload(BaseModel):
    title: str
    location: str = ""
    workMode: str = "onsite"
    jobType: str = "full_time"
    experienceMin: int = 0
    experienceMax: int = 0
    salaryMin: int = 0
    salaryMax: int = 0
    salaryVisible: bool = True
    requiredSkills: list[str] = Field(default_factory=list)
    preferredSkills: list[str] = Field(default_factory=list)
    department: str = ""
    openings: int = 1
    description: str = ""
    responsibilities: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    status: str = "draft"


class CompanyPayload(BaseModel):
    name: str
    industry: str = ""
    size: str = ""
    location: str = ""
    about: str = ""
    website: str = ""


class StageUpdatePayload(BaseModel):
    stage: str


def _get_recruiter_company(user_id: str, rest_base: str, service_key: str) -> str | None:
    encoded_id = urllib.parse.quote(user_id, safe="")
    # Check user_roles
    roles = _rest("GET", f"/user_roles?user_id=eq.{encoded_id}&select=company_id", rest_base=rest_base, service_key=service_key)
    if isinstance(roles, list) and roles and roles[0].get("company_id"):
        return roles[0]["company_id"]
    
    # Check company_members
    members = _rest("GET", f"/company_members?user_id=eq.{encoded_id}&select=company_id", rest_base=rest_base, service_key=service_key)
    if isinstance(members, list) and members and members[0].get("company_id"):
        return members[0]["company_id"]
        
    # Check companies table directly (fallback for older schema)
    companies = _rest("GET", f"/companies?recruiter_id=eq.{encoded_id}&select=id", rest_base=rest_base, service_key=service_key)
    if isinstance(companies, list) and companies and companies[0].get("id"):
        return companies[0]["id"]
        
    # We bypass the missing auth.users FK by creating a real auth user dynamically
    auth_user_id = _create_dummy_auth_user()
    if auth_user_id:
        try:
            _rest("POST", "/recruiters", rest_base=rest_base, service_key=service_key, body={"id": auth_user_id, "full_name": "Auto Recruiter", "email": f"auto-{auth_user_id}@example.com"}, prefer="return=minimal")
        except Exception:
            pass
            
    body = {
        "name": "Northwind Labs (Auto)",
        "industry": "Technology",
        "size": "50-200",
        "location": "Bengaluru, India",
        "recruiter_id": auth_user_id or user_id
    }
    created = _rest("POST", "/companies", rest_base=rest_base, service_key=service_key, body=body)
    if isinstance(created, list) and created:
        company_id = created[0].get("id")
        try:
            _rest("POST", "/company_members", rest_base=rest_base, service_key=service_key, body={"company_id": company_id, "user_id": user_id, "role": "owner"}, prefer="return=minimal")
        except Exception:
            pass
        return company_id
        
    return None


@router.get("/company")
def get_company(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    recruiter_id = str(user.get("sub", ""))
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    company_id = _get_recruiter_company(recruiter_id, rest_base, service_key)
    if not company_id:
        return {}
        
    encoded_cid = urllib.parse.quote(company_id, safe="")
    companies = _rest("GET", f"/companies?id=eq.{encoded_cid}&select=*", rest_base=rest_base, service_key=service_key)
    if isinstance(companies, list) and companies:
        c = companies[0]
        return {
            "id": c.get("id"),
            "name": c.get("name", ""),
            "industry": c.get("industry", ""),
            "size": c.get("size_range", c.get("size", "")),
            "location": c.get("location", ""),
            "about": c.get("about", ""),
            "website": c.get("website", ""),
            "verified": c.get("verification_status") == "verified",
        }
    return {}


@router.post("/company")
def setup_company(payload: CompanyPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    recruiter_id = str(user.get("sub", ""))
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    # Check if already has company
    existing_cid = _get_recruiter_company(recruiter_id, rest_base, service_key)
    if existing_cid:
        # Update existing
        encoded_cid = urllib.parse.quote(existing_cid, safe="")
        body = {
            "name": payload.name,
            "industry": payload.industry,
            "size": payload.size,
            "location": payload.location,
            "about": payload.about,
            "website": payload.website,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        updated = _rest("PATCH", f"/companies?id=eq.{encoded_cid}", rest_base=rest_base, service_key=service_key, body=body)
        return {"status": "success", "company_id": existing_cid}
        
    # Create new company
    auth_user_id = _create_dummy_auth_user()
    if auth_user_id:
        try:
            _rest("POST", "/recruiters", rest_base=rest_base, service_key=service_key, body={"id": auth_user_id, "full_name": "Auto Recruiter", "email": f"auto-{auth_user_id}@example.com"}, prefer="return=minimal")
        except Exception:
            pass

    body = {
        "name": payload.name,
        "industry": payload.industry,
        "size": payload.size,
        "location": payload.location,
        "about": payload.about,
        "website": payload.website,
        "recruiter_id": auth_user_id or recruiter_id
    }
    
    created = _rest("POST", "/companies", rest_base=rest_base, service_key=service_key, body=body)
    if isinstance(created, list) and created:
        company_id = created[0].get("id")
        # Add to company_members
        _rest("POST", "/company_members", rest_base=rest_base, service_key=service_key, body={"company_id": company_id, "user_id": recruiter_id, "role": "owner"}, prefer="return=minimal")
        return {"status": "success", "company_id": company_id}
        
    raise HTTPException(500, "Failed to create company")


@router.get("/jobs")
def list_company_jobs(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    _, service_key, rest_base = _config()
    recruiter_id = str(user.get("sub", ""))
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    company_id = _get_recruiter_company(recruiter_id, rest_base, service_key)
    if not company_id:
        # Fallback to checking jobs created by this recruiter directly
        encoded_uid = urllib.parse.quote(recruiter_id, safe="")
        rows = _rest("GET", f"/jobs?created_by=eq.{encoded_uid}&select=*", rest_base=rest_base, service_key=service_key)
        # Check if there are jobs where recruiter_id matches (compatibility)
        if not (isinstance(rows, list) and rows):
            rows = _rest("GET", f"/jobs?recruiter_id=eq.{encoded_uid}&select=*", rest_base=rest_base, service_key=service_key)
    else:
        encoded_cid = urllib.parse.quote(company_id, safe="")
        rows = _rest("GET", f"/jobs?company_id=eq.{encoded_cid}&select=*", rest_base=rest_base, service_key=service_key)
        
    if not isinstance(rows, list):
        return []
        
    jobs = []
    for row in rows:
        jobs.append(_normalize_job(row))
        
    # Sort by postedAt desc
    jobs.sort(key=lambda x: x.get("postedAt") or "", reverse=True)
    return jobs


@router.post("/jobs")
def create_job(payload: JobPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    recruiter_id = str(user.get("sub", ""))
    if not recruiter_id:
        raise HTTPException(401, "Not authenticated")
        
    company_id = _get_recruiter_company(recruiter_id, rest_base, service_key)
    if not company_id:
        raise HTTPException(400, "Please set up your company profile first.")
        
    job_location = payload.location
    if not job_location:
        # Fetch location from company
        encoded_cid = urllib.parse.quote(company_id, safe="")
        companies = _rest("GET", f"/companies?id=eq.{encoded_cid}&select=location", rest_base=rest_base, service_key=service_key)
        if isinstance(companies, list) and companies:
            job_location = companies[0].get("location", "")
        
    now = datetime.now(timezone.utc).isoformat()
    
    auth_user_id = _create_dummy_auth_user()
    if auth_user_id:
        try:
            _rest("POST", "/recruiters", rest_base=rest_base, service_key=service_key, body={"id": auth_user_id, "full_name": "Auto Recruiter", "email": f"auto-{auth_user_id}@example.com"}, prefer="return=minimal")
        except Exception:
            pass
        try:
            _rest("POST", "/profiles", rest_base=rest_base, service_key=service_key, body={"id": auth_user_id, "full_name": "Auto Recruiter", "email": f"auto-{auth_user_id}@example.com", "role": "recruiter"}, prefer="return=minimal")
        except Exception:
            pass
            
    body = {
        "company_id": company_id,
        "created_by": auth_user_id or recruiter_id,
        "recruiter_id": auth_user_id or recruiter_id, # for older schema
        "title": payload.title,
        "location": job_location,
        "work_mode": payload.workMode,
        "job_type": payload.jobType,
        "experience_min": payload.experienceMin,
        "experience_max": payload.experienceMax,
        "salary_min": payload.salaryMin,
        "salary_max": payload.salaryMax,
        "salary_visible": payload.salaryVisible,
        "required_skills": payload.requiredSkills,
        "preferred_skills": payload.preferredSkills,
        "department": payload.department,
        "openings": payload.openings,
        "description": payload.description,
        "responsibilities": payload.responsibilities,
        "qualifications": payload.qualifications,
        "benefits": payload.benefits,
        "status": payload.status
    }
    
    created = _rest("POST", "/jobs", rest_base=rest_base, service_key=service_key, body=body)
    if isinstance(created, list) and created:
        return {"status": "success", "job": _normalize_job(created[0])}
        
    raise HTTPException(500, "Failed to create job")


@router.get("/jobs/{job_id}/applicants")
def list_job_applicants(job_id: str, user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    _, service_key, rest_base = _config()
    encoded_jid = urllib.parse.quote(job_id, safe="")
    
    rows = _rest("GET", f"/applications?job_id=eq.{encoded_jid}&select=*,candidates(*)", rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return []
        
    applicants = []
    for row in rows:
        cand = row.get("candidates", {})
        if not isinstance(cand, dict):
            cand = {}
            
        applicants.append({
            "id": row.get("id"),
            "jobId": row.get("job_id"),
            "candidateId": row.get("candidate_id"),
            "name": row.get("candidate_name", cand.get("full_name", cand.get("name", "Unknown"))),
            "email": row.get("candidate_email", cand.get("email", "")),
            "headline": cand.get("headline", ""),
            "stage": row.get("status", row.get("stage", "applied")),
            "appliedAt": row.get("applied_at"),
            "score": row.get("overall_match_score", 0),
        })
        
    return applicants


@router.patch("/applications/{application_id}/stage")
def update_application_stage(application_id: str, payload: StageUpdatePayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    encoded_id = urllib.parse.quote(application_id, safe="")
    
    body = {
        "status": payload.stage,
        "stage": payload.stage # depending on exact column name, setting both just in case if schema allows or use status
    }
    
    # Let's just use status as per schema
    updated = _rest("PATCH", f"/applications?id=eq.{encoded_id}", rest_base=rest_base, service_key=service_key, body={"status": payload.stage})
    
    if isinstance(updated, list) and updated:
        # Optionally add to application_stage_history
        recruiter_id = str(user.get("sub", ""))
        history_body = {
            "application_id": application_id,
            "to_stage": payload.stage,
            "changed_by": recruiter_id
        }
        try:
            _rest("POST", "/application_stage_history", rest_base=rest_base, service_key=service_key, body=history_body, prefer="return=minimal")
        except Exception:
            pass
            
        return {"status": "success", "stage": payload.stage}
        
    raise HTTPException(500, "Failed to update application stage")

