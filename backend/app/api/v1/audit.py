from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.rbac import require_roles
from app.db.mongodb import get_database
from app.models.enums import UserRole

router = APIRouter(prefix="/audit", tags=["Security Audit Logs"])


@router.get("/logs")
async def list_audit_logs(
    limit: int = Query(default=50, le=200),
    action: Optional[str] = None,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.PLATFORM_MONITOR])),
    db=Depends(get_database)
):
    """
    Principal & Platform Monitor only: Review append-only security audit events.
    """
    query = {}
    if current_user.get("role") != UserRole.PLATFORM_MONITOR:
        query["college_id"] = current_user.get("college_id")

    if action:
        query["action"] = action

    cursor = db.audit_logs.find(query).sort("timestamp", -1).limit(limit)
    logs = []
    async for entry in cursor:
        entry["id"] = str(entry["_id"])
        logs.append(entry)
    return logs

