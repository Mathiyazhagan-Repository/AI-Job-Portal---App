from __future__ import annotations
import os
import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/team", tags=["team"])

class TeamInvite(BaseModel):
    company_id: str
    name: str
    email: str
    role: str

@router.post("/invite")
def invite_team_member(invite: TeamInvite, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required.")

    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    if not service_key or not supabase_url:
        raise HTTPException(status_code=503, detail="Supabase admin integration is not configured.")

    user_token = authorization.split(" ", 1)[1]
    api_headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

    try:
        user_request = urllib.request.Request(
            f"{supabase_url}/auth/v1/user",
            headers={"apikey": service_key, "Authorization": f"Bearer {user_token}"},
        )
        with urllib.request.urlopen(user_request) as response:
            recruiter = json.loads(response.read())

        company_request = urllib.request.Request(
            f"{supabase_url}/rest/v1/companies?id=eq.{invite.company_id}&recruiter_id=eq.{recruiter['id']}&select=id",
            headers=api_headers,
        )
        with urllib.request.urlopen(company_request) as response:
            company = json.loads(response.read())
        if not company:
            raise HTTPException(status_code=403, detail="You cannot invite members to this company.")

        normalized_email = invite.email.strip().lower()
        users_request = urllib.request.Request(
            f"{supabase_url}/auth/v1/admin/users?page=1&per_page=1000",
            headers=api_headers,
        )
        with urllib.request.urlopen(users_request) as response:
            users = json.loads(response.read()).get("users", [])

        existing = next((user for user in users if user.get("email", "").lower() == normalized_email), None)
        if existing:
            is_pending_team_invite = (
                not existing.get("email_confirmed_at")
            )
            if not is_pending_team_invite:
                raise HTTPException(status_code=409, detail="A user with this email address is already registered.")

            delete_request = urllib.request.Request(
                f"{supabase_url}/auth/v1/admin/users/{existing['id']}",
                method="DELETE",
                headers=api_headers,
            )
            with urllib.request.urlopen(delete_request):
                pass

        payload = json.dumps({
            "email": normalized_email,
            "data": {
                "team_invite": {
                    "company_id": invite.company_id,
                    "name": invite.name.strip(),
                    "role": invite.role if invite.role != "owner" else "viewer",
                },
            },
        }).encode()
        invite_request = urllib.request.Request(
            f"{supabase_url}/auth/v1/invite?redirect_to={urllib.parse.quote(os.getenv('FRONTEND_URL', 'http://localhost:5173/login'), safe='')}",
            data=payload,
            method="POST",
            headers={**api_headers, "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(invite_request) as response:
            return {"status": "invited", "user": json.loads(response.read())}
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="ignore")
        try:
            detail = json.loads(detail).get("msg") or json.loads(detail).get("message") or detail
        except json.JSONDecodeError:
            pass
        raise HTTPException(status_code=error.code, detail=detail or "Unable to send invitation.") from error
    except urllib.error.URLError as error:
        raise HTTPException(status_code=502, detail=f"Supabase connection failed: {error.reason}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Invitation setup failed: {error}") from error

@router.get("/")
def get_team(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required.")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    if not service_key or not supabase_url:
        raise HTTPException(status_code=503, detail="Supabase admin integration is not configured.")

    token = authorization.split(" ", 1)[1]
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
    user_request = urllib.request.Request(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": service_key, "Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(user_request) as response:
            user = json.loads(response.read())
        user_id = user["id"]

        company_request = urllib.request.Request(
            f"{supabase_url}/rest/v1/companies?recruiter_id=eq.{user_id}&select=id,recruiter_id",
            headers=headers,
        )
        with urllib.request.urlopen(company_request) as response:
            companies = json.loads(response.read())
        if not companies:
            membership_request = urllib.request.Request(
                f"{supabase_url}/rest/v1/Team?member_id=eq.{user_id}&status=eq.active&select=company_id&limit=1",
                headers=headers,
            )
            with urllib.request.urlopen(membership_request) as response:
                memberships = json.loads(response.read())
            if memberships:
                company_request = urllib.request.Request(
                    f"{supabase_url}/rest/v1/companies?id=eq.{memberships[0]['company_id']}&select=id,recruiter_id",
                    headers=headers,
                )
                with urllib.request.urlopen(company_request) as response:
                    companies = json.loads(response.read())
        if not companies:
            return {"owner": None, "members": []}

        company = companies[0]
        owner_request = urllib.request.Request(
            f"{supabase_url}/rest/v1/recruiters?id=eq.{company['recruiter_id']}&select=id,full_name,email",
            headers=headers,
        )
        members_request = urllib.request.Request(
            f"{supabase_url}/rest/v1/Team?company_id=eq.{company['id']}&status=eq.active&select=id,member_id,member_name,member_email,role,jobs_owned,last_active,created_at",
            headers=headers,
        )
        with urllib.request.urlopen(owner_request) as response:
            owner_rows = json.loads(response.read())
        with urllib.request.urlopen(members_request) as response:
            members = json.loads(response.read())
        return {"owner": owner_rows[0] if owner_rows else None, "members": members}
    except urllib.error.HTTPError as error:
        raise HTTPException(status_code=error.code, detail="Unable to load team data.") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to load team data: {error}") from error
