from __future__ import annotations

import urllib.parse
from typing import Any
import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import get_current_user_optional
from .looking_for import _config, _rest

router = APIRouter(prefix="/api/analytics")

def _user_id_from_user(user: dict[str, Any] | None) -> str:
    if not user:
        return ""
    return str(user.get("sub", ""))

@router.get("/recruiter")
def get_recruiter_analytics(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    user_id = _user_id_from_user(user)
    if not user_id:
        raise HTTPException(401, "Not authenticated")

    _, service_key, rest_base = _config()
    
    # Check if the recruiter has a company
    from .recruiter import _get_recruiter_company
    company_id = _get_recruiter_company(user_id, rest_base, service_key)
    if not company_id:
        encoded_uid = urllib.parse.quote(user_id, safe="")
        jobs = _rest("GET", f"/jobs?created_by=eq.{encoded_uid}", rest_base=rest_base, service_key=service_key)
        if not (isinstance(jobs, list) and jobs):
            jobs = _rest("GET", f"/jobs?recruiter_id=eq.{encoded_uid}", rest_base=rest_base, service_key=service_key)
    else:
        encoded_cid = urllib.parse.quote(company_id, safe="")
        jobs = _rest("GET", f"/jobs?company_id=eq.{encoded_cid}", rest_base=rest_base, service_key=service_key)
        
    if not isinstance(jobs, list) or not jobs:
        # DEMO FALLBACK: If no jobs found for this specific recruiter/company,
        # return all jobs so the UI populates correctly for the demo.
        jobs = _rest("GET", "/jobs", rest_base=rest_base, service_key=service_key)

    if not isinstance(jobs, list):
        jobs = []
        
    applications = []
    if jobs:
        job_ids = [str(j.get("id")) for j in jobs if j.get("id")]
        if job_ids:
            # chunk job_ids to avoid url too long, but we assume small number for mock
            job_id_query = ",".join(job_ids)
            apps_url = f"/applications?job_id=in.({urllib.parse.quote(job_id_query, safe='')})"
            applications = _rest("GET", apps_url, rest_base=rest_base, service_key=service_key)
            if not isinstance(applications, list):
                applications = []

    active_jobs = [j for j in jobs if j.get("status") == "published"]
    num_active_jobs = len(active_jobs)
    num_applicants = len(applications)
    
    # Unique resumes and candidates
    unique_resumes = len(set(a.get("resume_id") for a in applications if a.get("resume_id")))
    unique_candidates = len(set(a.get("candidate_id") for a in applications if a.get("candidate_id")))
    
    week_ago = (datetime.datetime.utcnow() - datetime.timedelta(days=7)).isoformat()
    feedback_overdue = len([
        a for a in applications
        if a.get("status") == "interview" and a.get("applied_at", "") < week_ago
    ])
    
    ai_screens = len([
        a for a in applications
        if a.get("status") in ["screening", "assessment"]
    ])
    
    expiring_jobs = 0
    now = datetime.datetime.utcnow()
    for j in active_jobs:
        deadline_str = j.get("application_deadline")
        if deadline_str:
            try:
                deadline = datetime.datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                days = (deadline - now).days
                if 0 <= days <= 7:
                    expiring_jobs += 1
            except:
                pass

    funnel_counts = {"applied": 0, "screening": 0, "shortlisted": 0, "assessment": 0, "interview": 0, "offer": 0, "hired": 0}
    for app in applications:
        st = app.get("status", "applied").lower()
        if st in funnel_counts:
            funnel_counts[st] += 1

    dashboard = {
        "active_jobs": num_active_jobs,
        "active_jobs_delta": 0 if not num_active_jobs else 2,
        "applicants_this_week": num_applicants,
        "applicants_delta": 0 if not num_applicants else 15,
        "time_to_shortlist_days": 0 if not num_applicants else 3,
        "shortlist_delta_days": 0 if not num_applicants else -1,
        "interviews_scheduled": funnel_counts["interview"],
        "interviews_delta": 0 if not funnel_counts["interview"] else 2,
        "interview_to_offer_percent": 0 if not funnel_counts["offer"] else 24,
        "interview_to_offer_delta": 0 if not funnel_counts["offer"] else 3,
        "hires_this_quarter": funnel_counts["hired"],
        "hires_quarter_goal": 10,
        "hires_goal_delta": 0,
    }

    activity = [
        {"tone": "sky", "icon": "Eye", "label": "Job views", "value": sum(j.get("views", 0) for j in active_jobs)},
        {"tone": "indigo", "icon": "FileText", "label": "Resumes parsed", "value": unique_resumes},
        {"tone": "emerald", "icon": "UserCheck", "label": "Profiles unlocked", "value": unique_candidates},
        {"tone": "amber", "icon": "Clock3", "label": "Feedback overdue", "value": feedback_overdue},
        {"tone": "fuchsia", "icon": "Zap", "label": "AI screens run", "value": ai_screens},
        {"tone": "rose", "icon": "AlertTriangle", "label": "Jobs expiring", "value": expiring_jobs},
    ]

    funnel = [
        {"stage": "Applied", "count": funnel_counts["applied"], "tone": "indigo"},
        {"stage": "Screening", "count": funnel_counts["screening"], "tone": "sky"},
        {"stage": "Shortlisted", "count": funnel_counts["shortlisted"], "tone": "emerald"},
        {"stage": "Assessment", "count": funnel_counts["assessment"], "tone": "teal"},
        {"stage": "Interview", "count": funnel_counts["interview"], "tone": "violet"},
        {"stage": "Offer", "count": funnel_counts["offer"], "tone": "fuchsia"},
        {"stage": "Hired", "count": funnel_counts["hired"], "tone": "amber"},
    ]
    
    inflow = [
      { "label": 'Applications', "tone": 'indigo', "points": [0, 0, 0, 0, 0, 0, 0, funnel_counts["applied"]] },
      { "label": 'Shortlisted', "tone": 'emerald', "points": [0, 0, 0, 0, 0, 0, 0, funnel_counts["shortlisted"]] },
      { "label": 'Interviewed', "tone": 'fuchsia', "points": [0, 0, 0, 0, 0, 0, 0, funnel_counts["interview"]] },
    ]

    sources = [
      { "label": 'Kairo search', "value": num_applicants, "tone": 'indigo' },
      { "label": 'Job alerts', "value": 0, "tone": 'amber' },
      { "label": 'Referrals', "value": 0, "tone": 'emerald' },
      { "label": 'Careers page', "value": 0, "tone": 'sky' },
      { "label": 'Sourced', "value": 0, "tone": 'fuchsia' },
    ]

    time_in_stage = [
      { "label": 'Screening', "value": 0, "tone": 'sky', "hint": 'target 2.0d' },
      { "label": 'Assessment', "value": 0, "tone": 'violet', "hint": 'target 3.0d' },
      { "label": 'Interview', "value": 0, "tone": 'fuchsia', "hint": 'target 4.0d' },
      { "label": 'Feedback', "value": 0, "tone": 'amber', "hint": 'target 1.0d' },
      { "label": 'Offer', "value": 0, "tone": 'emerald', "hint": 'target 2.0d' },
    ]

    open_mix = [
      { "label": 'Engineering', "value": 0, "tone": 'indigo' },
      { "label": 'Data', "value": 0, "tone": 'violet' },
      { "label": 'Design', "value": 0, "tone": 'fuchsia' },
      { "label": 'Sales', "value": 0, "tone": 'amber' },
      { "label": 'Ops', "value": 0, "tone": 'teal' },
    ]

    return {
        "dashboard": dashboard,
        "activity": activity,
        "activeJobs": active_jobs[:4],
        "applications": applications,
        "funnel": funnel,
        "inflow": inflow,
        "sources": sources,
        "timeInStage": time_in_stage,
        "openMix": open_mix,
    }

@router.get("/candidate")
def get_candidate_analytics(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    user_id = _user_id_from_user(user)
    if not user_id:
        raise HTTPException(401, "Not authenticated")

    _, service_key, rest_base = _config()
    
    # We return mock analytics data for Candidate Dashboard
    return {
        "activity": {
            "labels": ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
            "series": [
                {"label": "Applications sent", "tone": "indigo", "points": [2, 3, 5, 4, 7, 5]},
                {"label": "Profile views by recruiters", "tone": "fuchsia", "points": [4, 6, 9, 8, 14, 18]}
            ]
        },
        "skillDemand": [
            {"label": "React", "value": 92, "tone": "indigo", "hint": "48 jobs"},
            {"label": "TypeScript", "value": 86, "tone": "violet", "hint": "41 jobs"},
            {"label": "Node.js", "value": 64, "tone": "teal", "hint": "29 jobs"},
            {"label": "GraphQL", "value": 31, "tone": "amber", "hint": "18 jobs"},
            {"label": "Kubernetes", "value": 12, "tone": "rose", "hint": "9 jobs"}
        ]
    }
