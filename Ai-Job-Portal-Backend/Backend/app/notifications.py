from __future__ import annotations

import urllib.parse
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import get_current_user_optional
from .looking_for import _config, _rest

router = APIRouter(prefix="/api/notifications")

class NotificationReadPayload(BaseModel):
    read: boolean | None = True

def _first(row: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if row.get(name) is not None:
            return row[name]
    return default

def _user_id_from_user(user: dict[str, Any] | None) -> str:
    if not user:
        return ""
    return str(user.get("sub", ""))

@router.get("")
def list_notifications(user: dict[str, Any] | None = Depends(get_current_user_optional)) -> list[dict[str, Any]]:
    user_id = _user_id_from_user(user)
    if not user_id:
        raise HTTPException(401, "Not authenticated")

    _, service_key, rest_base = _config()
    rows = _rest("GET", f"/notifications?user_id=eq.{urllib.parse.quote(user_id, safe='')}&order=created_at.desc", 
                 rest_base=rest_base, service_key=service_key)
                 
    if not isinstance(rows, list):
        return []

    out = []
    for row in rows:
        out.append({
            "id": str(_first(row, "id", default="")),
            "type": _first(row, "type", default="system"),
            "title": _first(row, "title", default="Notification"),
            "body": _first(row, "body", default=""),
            "data": _first(row, "data", default={}),
            "read": row.get("read_at") is not None,
            "read_at": _first(row, "read_at", default=None),
            "created_at": _first(row, "created_at", default=""),
        })
    return out

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)) -> dict[str, Any]:
    user_id = _user_id_from_user(user)
    if not user_id:
        raise HTTPException(401, "Not authenticated")

    _, service_key, rest_base = _config()
    
    body = {"read_at": __import__('datetime').datetime.utcnow().isoformat() + 'Z'}
    
    updated = _rest("PATCH", f"/notifications?id=eq.{urllib.parse.quote(notification_id, safe='')}&user_id=eq.{urllib.parse.quote(user_id, safe='')}", 
                    rest_base=rest_base, service_key=service_key, body=body)
                    
    return {"ok": True, "read": True}
