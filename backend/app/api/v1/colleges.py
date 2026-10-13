from datetime import datetime
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rbac import get_current_user, require_roles
from app.core.security import generate_secure_college_code, get_password_hash
from app.db.mongodb import get_database
from app.models.college import (
    CollegeInDB,
    CollegeOut,
    CollegeRegisterRequest,
    CollegeVerificationAction,
    CollegeWithCode,
)
from app.models.enums import AuditAction, CollegeStatus, UserRole
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/colleges", tags=["Colleges & Platform Verification"])


@router.post("/register", response_model=CollegeOut, status_code=status.HTTP_201_CREATED)
async def register_college(
    payload: CollegeRegisterRequest,
    request: Request,
    db=Depends(get_database)
):
    """
    Step 1: Principal registers college with proof of university affiliation.
    College starts in 'pending_verification' status awaiting Platform Monitor review.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    # Check for existing registration number or principal email
    existing = await db.colleges.find_one({
        "$or": [
            {"registration_number": payload.registration_number.strip()},
            {"principal_email": payload.principal_email.lower().strip()},
        ]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A college with this registration number or principal email already exists",
        )

    secure_code = generate_secure_college_code(prefix="COLL")

    new_college = {
        "name": payload.name.strip(),
        "university_base": payload.university_base.strip(),
        "registration_number": payload.registration_number.strip(),
        "proof_document_url": payload.proof_document_url.strip(),
        "college_code": secure_code,
        "status": CollegeStatus.PENDING_VERIFICATION,
        "principal_name": payload.principal_name.strip(),
        "principal_email": payload.principal_email.lower().strip(),
        "principal_phone": payload.principal_phone.strip(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.colleges.insert_one(new_college)
    college_id = str(result.inserted_id)

    # Pre-create the Principal user account (active only upon college verification)
    principal_user = {
        "college_id": college_id,
        "role": UserRole.PRINCIPAL,
        "name": payload.principal_name.strip(),
        "email": payload.principal_email.lower().strip(),
        "phone": payload.principal_phone.strip(),
        "institution_id": f"PRIN-{payload.registration_number[-4:]}",
        "password_hash": get_password_hash(payload.principal_password),
        "is_verified": False,
        "is_active": False,  # Activated upon college verification
        "is_approved_by_hod": True,
        "profile_locked": True,
        "photo_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&h=240&q=85",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.users.insert_one(principal_user)

    await record_audit_event(
        user_id=payload.principal_email,
        user_role=UserRole.PRINCIPAL.value,
        action=AuditAction.COLLEGE_REGISTERED,
        resource_type="college",
        college_id=college_id,
        resource_id=college_id,
        details={"name": payload.name, "university": payload.university_base},
        ip_address=request.client.host if request.client else None,
    )

    new_college["id"] = college_id
    return new_college


@router.get("/pending", response_model=List[CollegeOut])
async def list_pending_colleges(
    current_user: dict = Depends(require_roles([UserRole.PLATFORM_MONITOR])),
    db=Depends(get_database)
):
    """
    Platform Monitor only: List all colleges awaiting proof/university verification.
    """
    cursor = db.colleges.find({"status": CollegeStatus.PENDING_VERIFICATION}).sort("created_at", -1)
    colleges = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        colleges.append(doc)
    return colleges


@router.post("/{college_id}/verify", response_model=CollegeOut)
async def verify_college(
    college_id: str,
    action_in: CollegeVerificationAction,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PLATFORM_MONITOR])),
    db=Depends(get_database)
):
    """
    Platform Monitor only: Review and activate or reject a college registration.
    Activating a college also activates the Principal user account.
    """
    college = await db.colleges.find_one({"_id": ObjectId(college_id)})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    monitor_id = current_user["id"]
    now = datetime.utcnow()

    if action_in.action == "approve":
        update_fields = {
            "status": CollegeStatus.ACTIVE,
            "verified_by": monitor_id,
            "verified_at": now,
            "updated_at": now,
        }
        await db.colleges.update_one({"_id": ObjectId(college_id)}, {"$set": update_fields})
        # Activate Principal user account
        await db.users.update_one(
            {"college_id": college_id, "role": UserRole.PRINCIPAL},
            {"$set": {"is_verified": True, "is_active": True, "updated_at": now}}
        )
        action_type = AuditAction.COLLEGE_VERIFIED
    else:
        update_fields = {
            "status": CollegeStatus.REJECTED,
            "verified_by": monitor_id,
            "rejection_reason": action_in.reason or "Proof verification failed",
            "updated_at": now,
        }
        await db.colleges.update_one({"_id": ObjectId(college_id)}, {"$set": update_fields})
        action_type = AuditAction.COLLEGE_REJECTED

    await record_audit_event(
        user_id=monitor_id,
        user_role=UserRole.PLATFORM_MONITOR.value,
        action=action_type,
        resource_type="college",
        college_id=college_id,
        resource_id=college_id,
        details={"action": action_in.action, "reason": action_in.reason},
        ip_address=request.client.host if request.client else None,
    )

    updated_college = await db.colleges.find_one({"_id": ObjectId(college_id)})
    updated_college["id"] = str(updated_college["_id"])
    return updated_college


@router.get("/my-college", response_model=CollegeWithCode)
async def get_my_college_details(
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL])),
    db=Depends(get_database)
):
    """
    Principal only: Access college profile and secure College Code for inviting HODs/Staff.
    """
    college_id = current_user.get("college_id")
    if not college_id:
        raise HTTPException(status_code=400, detail="User is not associated with a college")

    college = await db.colleges.find_one({"_id": ObjectId(college_id)})
    if not college:
        raise HTTPException(status_code=404, detail="College record not found")

    college["id"] = str(college["_id"])
    return college

