from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from .enums import ComplaintCategory, ComplaintStatus


class ReassignmentEntry(BaseModel):
    from_user_id: Optional[str] = None
    to_user_id: str
    assigned_by: str
    reason: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusChangeEntry(BaseModel):
    old_status: ComplaintStatus
    new_status: ComplaintStatus
    changed_by: str
    remarks: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    subject: str
    description: str
    is_anonymous: bool = False
    department_id: Optional[str] = None
    attachments: List[str] = []


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    remarks: Optional[str] = None


class ComplaintReassign(BaseModel):
    to_user_id: str
    reason: str


class ComplaintInDB(BaseModel):
    id: str = Field(alias="_id")
    ticket_number: str
    college_id: str
    department_id: Optional[str] = None
    is_anonymous: bool = False
    student_id: str
    student_name: Optional[str] = None
    category: ComplaintCategory
    subject: str
    description: str
    attachments: List[str] = []
    status: ComplaintStatus = ComplaintStatus.SUBMITTED
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    reassignments: List[ReassignmentEntry] = []
    status_history: List[StatusChangeEntry] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

