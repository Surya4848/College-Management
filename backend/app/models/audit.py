from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from .enums import AuditAction


class AuditLogEntry(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    college_id: Optional[str] = None
    user_id: str
    user_role: str
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

