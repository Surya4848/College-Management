from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from app.core.rbac import check_incharge_assignment, get_current_user, require_roles
from app.db.mongodb import get_database
from app.models.academic import (
    AttendanceCorrectionRequestCreate,
    AttendanceRecordInDB,
    DepartmentCreate,
    DepartmentInDB,
    StaffAssignmentCreate,
    TimetableEntryCreate,
    TimetableEntryInDB,
)
from app.models.enums import AttendanceStatus, AuditAction, UserRole
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/academics", tags=["Academics, Attendance & Staff Assignment"])


# --- DEPARTMENTS ---

@router.post("/departments", status_code=status.HTTP_201_CREATED)
async def create_department(
    dept_in: DepartmentCreate,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    existing = await db.departments.find_one({"college_id": college_id, "code": dept_in.code.upper().strip()})
    if existing:
        raise HTTPException(status_code=409, detail="Department with this code already exists")

    doc = {
        "college_id": college_id,
        "name": dept_in.name.strip(),
        "code": dept_in.code.upper().strip(),
        "hod_id": None,
        "created_at": datetime.utcnow(),
    }
    res = await db.departments.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc


@router.get("/departments")
async def list_departments(current_user: dict = Depends(get_current_user), db=Depends(get_database)):
    college_id = current_user.get("college_id")
    if not college_id:
        return []
    cursor = db.departments.find({"college_id": college_id})
    departments = []
    async for d in cursor:
        d["id"] = str(d["_id"])
        departments.append(d)
    return departments


# --- HOD: STAFF CONFIRMATION & ASSIGNMENT ---

@router.get("/staff/pending")
async def list_pending_staff(
    current_user: dict = Depends(require_roles([UserRole.HOD, UserRole.PRINCIPAL])),
    db=Depends(get_database)
):
    """List staff accounts awaiting HOD confirmation."""
    college_id = current_user["college_id"]
    query = {"college_id": college_id, "role": UserRole.STAFF, "is_approved_by_hod": False}
    if current_user.get("role") == UserRole.HOD and current_user.get("department_name"):
        query["department_name"] = current_user["department_name"]

    cursor = db.users.find(query)
    pending = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        u.pop("password_hash", None)
        pending.append(u)
    return pending


@router.post("/staff/confirm/{staff_id}")
async def confirm_staff_account(
    staff_id: str,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.HOD, UserRole.PRINCIPAL])),
    db=Depends(get_database)
):
    """HOD confirms staff account activation."""
    res = await db.users.update_one(
        {"_id": ObjectId(staff_id), "college_id": current_user["college_id"]},
        {"$set": {"is_approved_by_hod": True, "updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff account not found")

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.STAFF_CONFIRMED,
        resource_type="user",
        college_id=current_user["college_id"],
        resource_id=staff_id,
        details={"confirmed_by": current_user["name"]},
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Staff account confirmed and activated"}


@router.post("/staff/assign")
async def assign_staff_classes(
    assignment: StaffAssignmentCreate,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.HOD, UserRole.PRINCIPAL])),
    db=Depends(get_database)
):
    """HOD assigns in-charge responsibilities (program, year, section, subject)."""
    college_id = current_user["college_id"]
    doc = {
        "college_id": college_id,
        "department_id": assignment.department_id,
        "staff_id": assignment.staff_id,
        "assigned_classes": [c.dict() for c in assignment.assigned_classes],
        "created_by": current_user["id"],
        "updated_at": datetime.utcnow(),
    }
    await db.staff_assignments.update_one(
        {"college_id": college_id, "staff_id": assignment.staff_id},
        {"$set": doc},
        upsert=True
    )
    return {"message": "Staff in-charge assignments updated successfully"}


# --- ATTENDANCE (IN-CHARGE GUARDED) ---

class AttendanceMarkItem(BaseModel):
    student_id: str
    status: AttendanceStatus


class MarkAttendanceRequest(BaseModel):
    program: str
    year: str
    section: str
    date: str  # YYYY-MM-DD
    records: List[AttendanceMarkItem]


@router.post("/attendance/mark")
async def mark_attendance(
    req: MarkAttendanceRequest,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.STAFF, UserRole.HOD])),
    db=Depends(get_database)
):
    """
    Mark attendance. Enforces hard rule: ordinary staff CANNOT mark attendance for unassigned sections!
    """
    # Verify in-charge permission
    is_assigned = await check_incharge_assignment(
        current_user, req.program, req.year, req.section, db
    )
    if not is_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You are not authorized as in-charge for {req.program} Year {req.year} Section {req.section}",
        )

    college_id = current_user["college_id"]
    dept_id = current_user.get("department_id", "default")
    now = datetime.utcnow()

    for item in req.records:
        await db.attendance_records.update_one(
            {
                "college_id": college_id,
                "student_id": item.student_id,
                "date": req.date,
            },
            {
                "$set": {
                    "department_id": dept_id,
                    "section": req.section,
                    "status": item.status,
                    "marked_by": current_user["id"],
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "created_at": now,
                    "audits": [],
                }
            },
            upsert=True
        )

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.ATTENDANCE_MARKED,
        resource_type="attendance",
        college_id=college_id,
        details={"section": req.section, "date": req.date, "count": len(req.records)},
        ip_address=request.client.host if request.client else None,
    )
    return {"message": f"Attendance recorded for {len(req.records)} students"}


# --- ATTENDANCE CORRECTIONS (APPEND-AUDITED) ---

class AttendanceCorrectionReview(BaseModel):
    action: str  # approve | reject
    remarks: Optional[str] = None


@router.post("/attendance/request-correction")
async def request_attendance_correction(
    req: AttendanceCorrectionRequestCreate,
    current_user: dict = Depends(require_roles([UserRole.STUDENT])),
    db=Depends(get_database)
):
    """Student submits an attendance correction request."""
    college_id = current_user["college_id"]
    doc = {
        "college_id": college_id,
        "department_id": current_user.get("department_id", ""),
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "register_number": current_user["institution_id"],
        "date": req.date,
        "requested_status": req.requested_status,
        "reason": req.reason.strip(),
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    res = await db.attendance_corrections.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc


@router.get("/attendance/correction-requests")
async def list_correction_requests(
    current_user: dict = Depends(require_roles([UserRole.STAFF, UserRole.HOD])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    cursor = db.attendance_corrections.find({"college_id": college_id, "status": "pending"}).sort("created_at", -1)
    requests = []
    async for r in cursor:
        r["id"] = str(r["_id"])
        requests.append(r)
    return requests


@router.post("/attendance/review-correction/{req_id}")
async def review_correction_request(
    req_id: str,
    review: AttendanceCorrectionReview,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.STAFF, UserRole.HOD])),
    db=Depends(get_database)
):
    """
    Authorized staff reviews attendance correction.
    If approved: updates attendance record and appends to audit trail! Never silently overwrites.
    """
    req_doc = await db.attendance_corrections.find_one({"_id": ObjectId(req_id)})
    if not req_doc:
        raise HTTPException(status_code=404, detail="Request not found")

    college_id = current_user["college_id"]
    now = datetime.utcnow()

    if review.action == "approve":
        # Look up existing attendance record
        existing = await db.attendance_records.find_one({
            "college_id": college_id,
            "student_id": req_doc["student_id"],
            "date": req_doc["date"],
        })
        old_val = existing.get("status", AttendanceStatus.ABSENT) if existing else AttendanceStatus.ABSENT

        audit_entry = {
            "old_value": old_val,
            "new_value": req_doc["requested_status"],
            "reason": req_doc["reason"],
            "edited_by": current_user["id"],
            "edited_at": now,
            "correction_request_id": req_id,
        }

        await db.attendance_records.update_one(
            {"college_id": college_id, "student_id": req_doc["student_id"], "date": req_doc["date"]},
            {
                "$set": {"status": req_doc["requested_status"], "updated_at": now},
                "$push": {"audits": audit_entry}
            },
            upsert=True
        )

        status_update = "approved"
    else:
        status_update = "rejected"

    await db.attendance_corrections.update_one(
        {"_id": ObjectId(req_id)},
        {
            "$set": {
                "status": status_update,
                "reviewed_by": current_user["id"],
                "reviewed_at": now,
                "review_remarks": review.remarks,
            }
        }
    )

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.ATTENDANCE_CORRECTED,
        resource_type="attendance",
        college_id=college_id,
        resource_id=req_doc["student_id"],
        details={"request_id": req_id, "decision": status_update},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": f"Correction request {status_update}"}


# --- STUDENT ATTENDANCE OVERVIEW ---

@router.get("/attendance/my-record")
async def get_my_attendance(
    current_user: dict = Depends(require_roles([UserRole.STUDENT])),
    db=Depends(get_database)
):
    """Returns student's personal attendance statistics and recent history."""
    college_id = current_user["college_id"]
    student_id = current_user["id"]

    cursor = db.attendance_records.find({"college_id": college_id, "student_id": student_id}).sort("date", -1)
    records = []
    total = 0
    present_count = 0

    async for r in cursor:
        r["id"] = str(r["_id"])
        total += 1
        if r.get("status") in [AttendanceStatus.PRESENT, AttendanceStatus.OD]:
            present_count += 1
        records.append(r)

    rate = round((present_count / total * 100), 1) if total > 0 else 100.0
    return {
        "total_classes": total,
        "present_count": present_count,
        "absent_count": total - present_count,
        "attendance_rate": rate,
        "records": records[:30],
    }

