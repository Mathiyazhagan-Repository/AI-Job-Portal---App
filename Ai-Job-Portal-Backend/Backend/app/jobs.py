from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from .looking_for import _config, _rest

router = APIRouter(prefix="/api")


def _first(row: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if row.get(name) is not None:
            return row[name]
    return default


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _normalize_job(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(_first(row, "id", default="")),
        "title": _first(row, "title", "job_title", default=""),
        "companyId": str(_first(row, "company_id", "companyId", default="")),
        "location": _first(row, "location", default=""),
        "workMode": _first(row, "work_mode", "workMode", default="onsite"),
        "jobType": _first(row, "job_type", "jobType", default="full_time"),
        "experienceMin": _first(row, "experience_min", "experienceMin", default=0),
        "experienceMax": _first(row, "experience_max", "experienceMax", default=0),
        "salaryMin": _first(row, "salary_min", "salaryMin", default=600000),
        "salaryMax": _first(row, "salary_max", "salaryMax", default=4000000),
        "salaryVisible": _first(row, "salary_visible", "salaryVisible", default=True),
        "requiredSkills": _as_list(_first(row, "required_skills", "requiredSkills")),
        "preferredSkills": _as_list(_first(row, "preferred_skills", "preferredSkills")),
        "postedAt": _first(row, "posted_at", "postedAt", default=""),
        "applicants": _first(row, "applicants", default=0),
        "views": _first(row, "views", default=0),
        "status": _first(row, "status", default="published"),
        "department": _first(row, "department", default=""),
        "openings": _first(row, "openings", default=1),
        "deadline": _first(row, "deadline", default=""),
        "description": _first(row, "description", default=""),
        "responsibilities": _as_list(_first(row, "responsibilities")),
        "qualifications": _as_list(_first(row, "qualifications")),
        "benefits": _as_list(_first(row, "benefits")),
    }


@router.get("/jobs")
def list_jobs() -> list[dict[str, Any]]:
    """Return published jobs from Supabase in the frontend job shape."""
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY",
        )

    rows = _rest(
        "GET",
        "/jobs?select=*",
        rest_base=rest_base,
        service_key=service_key,
    )
    if not isinstance(rows, list):
        return []
    return [
        job for job in (_normalize_job(row) for row in rows)
        if job["status"] == "published"
    ]
