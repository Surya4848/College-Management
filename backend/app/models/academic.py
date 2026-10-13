from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from .enums import AttendanceStatus, ClassType


class DepartmentBase(BaseModel):
    name: str
    code: str  # e.g. "IT", "CSE", "ECE"


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentInDB(DepartmentBase):
    id: str = Field(alias="_id")
    college_id: str
    hod_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ClassAssignment(BaseModel):
    program: str  # e.g. "B.Tech IT"
    year: str     # e.g. "III"
    section: str  # e.g. "A"
    subject: str  # e.g. "Cloud Computing"


class StaffAssignmentCreate(BaseModel):
    staff_id: str
    department_id: str
    assigned_classes: List[ClassAssignment]


class StaffAssignmentInDB(StaffAssignmentCreate):
    id: str = Field(alias="_id")
    college_id: str
    created_by: str  # HOD ID
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class AttendanceAuditEntry(BaseModel):
    old_value: AttendanceStatus
    new_value: AttendanceStatus
    reason: str
    edited_by: str  # Staff or HOD User ID
    edited_at: datetime = Field(default_factory=datetime.utcnow)
    correction_request_id: Optional[str] = None


class AttendanceRecordInDB(BaseModel):
    id: str = Field(alias="_id")
    college_id: str
    department_id: str
    student_id: str
    date: str  # YYYY-MM-DD
    section: str
    status: AttendanceStatus
    marked_by: str
    audits: List[AttendanceAuditEntry] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class AttendanceCorrectionRequestCreate(BaseModel):
    date: str
    requested_status: AttendanceStatus
    reason: str


class AttendanceCorrectionRequestInDB(BaseModel):
    id: str = Field(alias="_id")
    college_id: str
    department_id: str
    student_id: str
    student_name: str
    register_number: str
    date: str
    requested_status: AttendanceStatus
    reason: str
    status: str = "pending"  # "pending", "approved", "rejected"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class TimetableEntryCreate(BaseModel):
    day_index: int = Field(ge=0, le=6)  # 0=Monday to 6=Sunday
    start_time: str
    end_time: str
    subject: str
    section: str
    room: str
    class_type: ClassType = ClassType.LECTURE
    notes: Optional[str] = None


class TimetableEntryInDB(TimetableEntryCreate):
    id: str = Field(alias="_id")
    college_id: str
    staff_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

