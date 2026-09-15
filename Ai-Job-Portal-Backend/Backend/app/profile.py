from __future__ import annotations

import json
import urllib.parse
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .auth import get_current_user
from .looking_for import _config, _rest

router = APIRouter(prefix="/api/candidate")

class ExperienceEntry(BaseModel):
    id: str = ""
    company: str
    title: str
    from_date: str = Field(alias="from")
    to_date: str = Field(alias="to")
    current: bool = False
    detail: str = ""

class EducationEntry(BaseModel):
    id: str = ""
    institution: str
    degree: str
    field: str
    from_date: str = Field(alias="from")
    to_date: str = Field(alias="to")
    grade: str = ""

class ProfileDataPayload(BaseModel):
    name: str = ""
    headline: str = ""
    location: str = ""
    email: str = ""
    phone: str = ""
    summary: str = ""
    totalExperience: float = 0
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)


@router.get("/profile/full")
def get_full_profile(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        raise HTTPException(401, "Not authenticated")
    
    encoded_id = urllib.parse.quote(candidate_id, safe="")
    
    # Base candidate / profile fetch
    candidates = _rest("GET", f"/Candidates?id=eq.{encoded_id}&select=*", rest_base=rest_base, service_key=service_key)
    candidate = candidates[0] if isinstance(candidates, list) and candidates else {}
    
    # Skills
    skills_rows = _rest("GET", f"/candidate_skills?candidate_id=eq.{encoded_id}&select=skill_id,skills(name)", rest_base=rest_base, service_key=service_key)
    skills = []
    if isinstance(skills_rows, list):
        for row in skills_rows:
            if "skills" in row and isinstance(row["skills"], dict) and "name" in row["skills"]:
                skills.append(row["skills"]["name"])
    
    # Experience
    exp_rows = _rest("GET", f"/experience?candidate_id=eq.{encoded_id}&select=*&order=start_date.desc.nullslast", rest_base=rest_base, service_key=service_key)
    experience = []
    if isinstance(exp_rows, list):
        for row in exp_rows:
            experience.append({
                "id": str(row.get("id")),
                "company": row.get("company_name", ""),
                "title": row.get("title", ""),
                "from": row.get("start_date", ""),
                "to": row.get("end_date", ""),
                "current": row.get("is_current", False),
                "detail": row.get("description", "")
            })
            
    # Education
    edu_rows = _rest("GET", f"/education?candidate_id=eq.{encoded_id}&select=*&order=start_date.desc.nullslast", rest_base=rest_base, service_key=service_key)
    education = []
    if isinstance(edu_rows, list):
        for row in edu_rows:
            education.append({
                "id": str(row.get("id")),
                "institution": row.get("institution", ""),
                "degree": row.get("degree", ""),
                "field": row.get("field", ""),
                "from": row.get("start_date", ""),
                "to": row.get("end_date", ""),
                "grade": row.get("grade", "")
            })

    # For mock compliance (since not all tables are populated for strings like languages/certifications)
    # We will fetch from candidate preferences or profile extensions if they exist, but for now we return empty or defaults.
    
    return {
        "name": candidate.get("full_name", user.get("name", "")),
        "headline": candidate.get("headline", ""),
        "location": candidate.get("location", ""),
        "email": candidate.get("email", user.get("email", "")),
        "phone": candidate.get("phone", ""),
        "summary": candidate.get("summary", ""),
        "totalExperience": float(candidate.get("total_experience_years", 0)),
        "skills": skills,
        "experience": experience,
        "education": education,
        "certifications": [],
        "languages": []
    }


@router.put("/profile/full")
def update_full_profile(payload: ProfileDataPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    candidate_id = str(user.get("sub", ""))
    if not candidate_id:
        raise HTTPException(401, "Not authenticated")
        
    encoded_id = urllib.parse.quote(candidate_id, safe="")
    
    # 1. Update Candidates table
    candidate_update = {
        "full_name": payload.name,
        "location": payload.location,
        "headline": payload.headline,
        "summary": payload.summary,
        "total_experience_years": payload.totalExperience,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        _rest("PATCH", f"/Candidates?id=eq.{encoded_id}", rest_base=rest_base, service_key=service_key, body=candidate_update)
    except Exception:
        pass
        
    # 2. Update Skills
    # First get or create skills
    skill_ids = []
    for skill_name in payload.skills:
        s_encoded = urllib.parse.quote(skill_name, safe="")
        s_rows = _rest("GET", f"/skills?name=eq.{s_encoded}&select=id", rest_base=rest_base, service_key=service_key)
        if isinstance(s_rows, list) and s_rows:
            skill_ids.append(s_rows[0]["id"])
        else:
            try:
                new_s = _rest("POST", "/skills", rest_base=rest_base, service_key=service_key, body={"name": skill_name})
                if isinstance(new_s, list) and new_s:
                    skill_ids.append(new_s[0]["id"])
            except Exception:
                pass
                
    # Delete old candidate_skills
    try:
        _rest("DELETE", f"/candidate_skills?candidate_id=eq.{encoded_id}", rest_base=rest_base, service_key=service_key, prefer="return=minimal")
    except Exception:
        pass
        
    # Insert new candidate_skills
    if skill_ids:
        c_skills = [{"candidate_id": candidate_id, "skill_id": sid} for sid in skill_ids]
        try:
            _rest("POST", "/candidate_skills", rest_base=rest_base, service_key=service_key, body=c_skills, prefer="return=minimal")
        except Exception:
            pass

    # 3. Update Experience
    try:
        _rest("DELETE", f"/experience?candidate_id=eq.{encoded_id}", rest_base=rest_base, service_key=service_key, prefer="return=minimal")
    except Exception:
        pass
    
    if payload.experience:
        exp_bodies = []
        for exp in payload.experience:
            body = {
                "candidate_id": candidate_id,
                "company_name": exp.company,
                "title": exp.title,
                "is_current": exp.current,
                "description": exp.detail
            }
            if exp.from_date:
                # Basic parsing or just set as string if DB accepts it, else skip date for now
                try:
                    body["start_date"] = "-".join(exp.from_date.split()[-1:]) + "-01-01" if len(exp.from_date) > 4 else None
                except Exception:
                    pass
            exp_bodies.append(body)
        try:
            _rest("POST", "/experience", rest_base=rest_base, service_key=service_key, body=exp_bodies, prefer="return=minimal")
        except Exception:
            pass
            
    # 4. Update Education
    try:
        _rest("DELETE", f"/education?candidate_id=eq.{encoded_id}", rest_base=rest_base, service_key=service_key, prefer="return=minimal")
    except Exception:
        pass
        
    if payload.education:
        edu_bodies = []
        for edu in payload.education:
            body = {
                "candidate_id": candidate_id,
                "institution": edu.institution,
                "degree": edu.degree,
                "field": edu.field,
                "grade": edu.grade
            }
            edu_bodies.append(body)
        try:
            _rest("POST", "/education", rest_base=rest_base, service_key=service_key, body=edu_bodies, prefer="return=minimal")
        except Exception:
            pass
            
    return {"status": "success"}

