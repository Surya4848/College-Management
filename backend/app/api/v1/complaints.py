import random
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rbac import get_current_user, require_roles
from app.db.mongodb import get_database
from app.models.complaint import (
    ComplaintCreate,
    ComplaintInDB,
    ComplaintReassign,
    ComplaintStatusUpdate,
)
from app.models.enums import AuditAction, ComplaintStatus, UserRole
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/complaints", tags=["Complaint & Helpdesk Tickets"])


def generate_ticket_number() -> str:
    year = datetime.utcnow().year
    num = random.randint(1000, 9999)
    return f"TKT-{year}-{num}"


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    comp_in: ComplaintCreate,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.STUDENT])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    ticket_no = generate_ticket_number()

    doc = {
        "ticket_number": ticket_no,
        "college_id": college_id,
        "department_id": comp_in.department_id or current_user.get("department_id"),
        "is_anonymous": comp_in.is_anonymous,
        "student_id": current_user["id"],
        "student_name": current_user["name"] if not comp_in.is_anonymous else "Anonymous Student",
        "category": comp_in.category,
        "subject": comp_in.subject.strip(),
        "description": comp_in.description.strip(),
        "attachments": comp_in.attachments,
        "status": ComplaintStatus.SUBMITTED,
        "assigned_to": None,
        "assigned_to_name": None,
        "reassignments": [],
        "status_history": [
            {
                "old_status": ComplaintStatus.SUBMITTED,
                "new_status": ComplaintStatus.SUBMITTED,
                "changed_by": current_user["name"],
                "remarks": "Ticket created",
                "timestamp": datetime.utcnow(),
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    res = await db.complaints.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.COMPLAINT_SUBMITTED,
        resource_type="complaint",
        college_id=college_id,
        resource_id=doc["id"],
        details={"ticket_number": ticket_no, "category": comp_in.category.value, "anonymous": comp_in.is_anonymous},
        ip_address=request.client.host if request.client else None,
    )
    return doc


@router.get("")
async def list_complaints(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    college_id = current_user.get("college_id")
    role = current_user.get("role")

    if role == UserRole.STUDENT:
        # Students see only their own tickets
        cursor = db.complaints.find({"college_id": college_id, "student_id": current_user["id"]}).sort("created_at", -1)
    elif role in [UserRole.STAFF, UserRole.HOD]:
        # Staff and HOD see tickets for their department
        dept_id = current_user.get("department_id")
        query = {"college_id": college_id}
        if dept_id:
            query["department_id"] = dept_id
        cursor = db.complaints.find(query).sort("created_at", -1)
    else:
        # Principal & Platform Monitor see all college tickets
        cursor = db.complaints.find({"college_id": college_id}).sort("created_at", -1)

    tickets = []
    async for t in cursor:
        t["id"] = str(t["_id"])
        # Mask student identity for ordinary handlers if anonymous
        if t.get("is_anonymous") and role not in [UserRole.PRINCIPAL, UserRole.PLATFORM_MONITOR]:
            if role != UserRole.STUDENT or t.get("student_id") != current_user["id"]:
                t["student_name"] = "Anonymous Student"
                t["student_id"] = "[Protected Identity]"
        tickets.append(t)
    return tickets


@router.patch("/{ticket_id}/status")
async def update_complaint_status(
    ticket_id: str,
    status_in: ComplaintStatusUpdate,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.HOD, UserRole.STAFF])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    complaint = await db.complaints.find_one({"_id": ObjectId(ticket_id), "college_id": college_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    old_status = complaint.get("status")
    now = datetime.utcnow()

    history_entry = {
        "old_status": old_status,
        "new_status": status_in.status,
        "changed_by": current_user["name"],
        "remarks": status_in.remarks,
        "timestamp": now,
    }

    await db.complaints.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {"status": status_in.status, "updated_at": now},
            "$push": {"status_history": history_entry}
        }
    )

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.COMPLAINT_STATUS_CHANGED,
        resource_type="complaint",
        college_id=college_id,
        resource_id=ticket_id,
        details={"old_status": old_status, "new_status": status_in.status.value, "remarks": status_in.remarks},
        ip_address=request.client.host if request.client else None,
    )
    return {"message": f"Status updated to {status_in.status.value}"}


@router.post("/{ticket_id}/reassign")
async def reassign_complaint(
    ticket_id: str,
    reassign_in: ComplaintReassign,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.HOD])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    complaint = await db.complaints.find_one({"_id": ObjectId(ticket_id), "college_id": college_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    # Verify target user is staff/HOD in this college
    target_staff = await db.users.find_one({"_id": ObjectId(reassign_in.to_user_id), "college_id": college_id})
    if not target_staff:
        raise HTTPException(status_code=404, detail="Target staff member not found in this college")

    now = datetime.utcnow()
    reassignment_entry = {
        "from_user_id": complaint.get("assigned_to"),
        "to_user_id": reassign_in.to_user_id,
        "assigned_by": current_user["name"],
        "reason": reassign_in.reason.strip(),
        "timestamp": now,
    }

    await db.complaints.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "assigned_to": reassign_in.to_user_id,
                "assigned_to_name": target_staff.get("name"),
                "status": ComplaintStatus.ASSIGNED,
                "updated_at": now,
            },
            "$push": {"reassignments": reassignment_entry}
        }
    )

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.COMPLAINT_REASSIGNED,
        resource_type="complaint",
        college_id=college_id,
        resource_id=ticket_id,
        details={"reassigned_to": target_staff.get("name"), "reason": reassign_in.reason},
        ip_address=request.client.host if request.client else None,
    )
    return {"message": f"Ticket reassigned to {target_staff.get('name')}"}

