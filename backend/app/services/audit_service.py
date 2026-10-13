import logging
from datetime import datetime
from typing import Any, Dict, Optional
from app.db.mongodb import get_database
from app.models.enums import AuditAction

logger = logging.getLogger("uvicorn.error")


async def record_audit_event(
    user_id: str,
    user_role: str,
    action: AuditAction,
    resource_type: str,
    college_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
):
    """Appends an immutable security audit event into the database."""
    event = {
        "college_id": college_id,
        "user_id": user_id,
        "user_role": user_role,
        "action": action.value if hasattr(action, "value") else str(action),
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "ip_address": ip_address,
        "timestamp": datetime.utcnow(),
    }
    
    db = await get_database()
    if db is not None:
        try:
            await db.audit_logs.insert_one(event)
        except Exception as e:
            logger.error(f"Failed to write audit event: {e}")
    else:
        logger.info(f"[AUDIT LOG FALLBACK]: {event}")

