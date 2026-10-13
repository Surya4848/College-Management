from enum import Enum


class UserRole(str, Enum):
    PLATFORM_MONITOR = "platform_monitor"
    PRINCIPAL = "principal"
    HOD = "hod"
    STAFF = "staff"
    STUDENT = "student"


class CollegeStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    OD = "od"  # On Duty
    LEAVE = "leave"


class ClassType(str, Enum):
    LECTURE = "Lecture"
    PRACTICAL = "Practical"
    LAB = "Lab"
    TUTORIAL = "Tutorial"
    OTHER = "Other"


class ComplaintCategory(str, Enum):
    ACADEMIC = "academic"
    INFRASTRUCTURE = "infrastructure"
    HOSTEL = "hostel"
    HARASSMENT = "harassment"
    GENERAL = "general"


class ComplaintStatus(str, Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    ASSIGNED = "assigned"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class AuditAction(str, Enum):
    COLLEGE_REGISTERED = "college_registered"
    COLLEGE_VERIFIED = "college_verified"
    COLLEGE_REJECTED = "college_rejected"
    USER_REGISTERED = "user_registered"
    STAFF_CONFIRMED = "staff_confirmed"
    STUDENT_ONBOARDED = "student_onboarded"
    PROFILE_LOCKED = "profile_locked"
    ATTENDANCE_MARKED = "attendance_marked"
    ATTENDANCE_CORRECTED = "attendance_corrected"
    ANNOUNCEMENT_PUBLISHED = "announcement_published"
    ANNOUNCEMENT_MODIFIED = "announcement_modified"
    ANNOUNCEMENT_WITHDRAWN = "announcement_withdrawn"
    COMPLAINT_SUBMITTED = "complaint_submitted"
    COMPLAINT_REASSIGNED = "complaint_reassigned"
    COMPLAINT_STATUS_CHANGED = "complaint_status_changed"
    SECURITY_EVENT = "security_event"

