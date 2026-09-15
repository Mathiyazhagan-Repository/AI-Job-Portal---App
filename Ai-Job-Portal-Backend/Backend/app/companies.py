from __future__ import annotations

import urllib.parse
from typing import Any

from fastapi import APIRouter, HTTPException, status

from .looking_for import _config, _rest

router = APIRouter(prefix="/api")


def _first(row: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if row.get(name) is not None:
            return row[name]
    return default


def _normalize_company(row: dict[str, Any]) -> dict[str, Any]:
    # Supabase uses `logo_key`, mock uses `logoUrl`. 
    # For now we handle basic mapping.
    return {
        "id": str(_first(row, "id", default="")),
        "name": _first(row, "name", default="Company"),
        "slug": _first(row, "slug", default=""),
        "logoHue": 210, # default hue since backend doesn't store this
        "industry": _first(row, "industry", default="Technology"),
        "size": _first(row, "size_range", "size", default="Unknown"),
        "location": _first(row, "location", default=""),
        "verified": _first(row, "verification_status") == "verified",
        "about": _first(row, "about", default=""),
        "openJobs": 0, # not computed yet
        "rating": 0, # not computed yet
    }


@router.get("/companies")
def list_companies() -> list[dict[str, Any]]:
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(500, "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY")

    rows = _rest("GET", "/companies?select=*", rest_base=rest_base, service_key=service_key)
    if not isinstance(rows, list):
        return []

    companies = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        companies.append(_normalize_company(row))
    return companies


@router.get("/companies/{company_id}")
def get_company(company_id: str) -> dict[str, Any]:
    _, service_key, rest_base = _config()
    if not service_key:
        raise HTTPException(500, "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY")

    rows = _rest(
        "GET",
        f"/companies?id=eq.{urllib.parse.quote(company_id, safe='')}&select=*&limit=1",
        rest_base=rest_base,
        service_key=service_key,
    )
    if not isinstance(rows, list) or not rows:
        raise HTTPException(404, "Company not found")
    return _normalize_company(rows[0])
