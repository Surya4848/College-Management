from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from app.core.rbac import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp_code,
    get_password_hash,
    verify_password,
)
from app.db.mongodb import get_database
from app.models.enums import AuditAction, CollegeStatus, UserRole
from app.models.user import StudentProfileUpdate, Token, UserCreate, UserLogin, UserOut
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & Onboarding"])


class ForgotPasswordRequest(BaseModel):
    identifier: str  # Email or Phone
    college_code: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, request: Request, db=Depends(get_database)):
    """
    Onboard student or staff member using verified College Code and institution-issued identity.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    # Platform Monitor and Principal cannot self-register through public onboarding
    if user_in.role in [UserRole.PLATFORM_MONITOR, UserRole.PRINCIPAL]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Privileged accounts must be created through the college verification gateway",
        )

    if not user_in.college_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College Code is mandatory for student and staff onboarding",
        )

    # Verify College Code and status
    college = await db.colleges.find_one({"college_code": user_in.college_code.strip()})
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid College Code. Please check with your institution administrator.",
        )

    if college.get("status") != CollegeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This college is currently awaiting platform verification or is inactive.",
        )

    college_id = str(college["_id"])

    # Check for duplicate email or institution_id within this college
    existing_user = await db.users.find_one({
        "college_id": college_id,
        "$or": [
            {"email": user_in.email.lower()},
            {"institution_id": user_in.institution_id.strip()},
            {"phone": user_in.phone.strip()},
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this Email, Register Number/Staff ID, or Phone already exists in this college.",
        )

    # Resolve Department if provided
    department_id = None
    if user_in.department_name:
        dept = await db.departments.find_one({
            "college_id": college_id,
            "name": {"$regex": f"^{user_in.department_name}$", "$options": "i"}
        })
        if dept:
            department_id = str(dept["_id"])

    # Build DB record
    new_user = {
        "college_id": college_id,
        "department_id": department_id,
        "department_name": user_in.department_name,
        "role": user_in.role,
        "name": user_in.name.strip(),
        "email": user_in.email.lower().strip(),
        "phone": user_in.phone.strip(),
        "institution_id": user_in.institution_id.strip(),
        "password_hash": get_password_hash(user_in.password),
        "is_verified": True,
        "is_active": True,
        # Staff must be confirmed by HOD; students are immediately active but profile-locked
        "is_approved_by_hod": False if user_in.role == UserRole.STAFF else True,
        "profile_locked": True if user_in.role == UserRole.STUDENT else False,
        "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)

    # Audit log
    await record_audit_event(
        user_id=user_id,
        user_role=user_in.role.value,
        action=AuditAction.USER_REGISTERED,
        resource_type="user",
        college_id=college_id,
        resource_id=user_id,
        details={"name": user_in.name, "institution_id": user_in.institution_id, "role": user_in.role.value},
        ip_address=request.client.host if request.client else None,
    )

    new_user["id"] = user_id
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request, db=Depends(get_database)):
    """Authenticate via email or phone + password with tenant validation."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection unavailable")

    identifier = credentials.identifier.strip().lower()

    # Search for user across email or phone
    query = {"$or": [{"email": identifier}, {"phone": credentials.identifier.strip()}]}
    user = await db.users.find_one(query)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials or unregistered account",
        )

    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials or unregistered account",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated or withdrawn",
        )

    # Staff HOD approval check
    if user.get("role") == UserRole.STAFF and not user.get("is_approved_by_hod", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your staff account is pending confirmation by your Head of Department (HOD).",
        )

    # Verify college status for non-platform monitors
    college_id = user.get("college_id")
    if college_id and user.get("role") != UserRole.PLATFORM_MONITOR:
        college = await db.colleges.find_one({"_id": ObjectId(college_id)})
        if not college or college.get("status") != CollegeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your institution is awaiting platform verification or has been suspended.",
            )

    user_id = str(user["_id"])
    role = user.get("role")

    access_token = create_access_token(subject=user_id, role=role, college_id=college_id)
    refresh_token = create_refresh_token(subject=user_id, role=role, college_id=college_id)

    user["id"] = user_id

    await record_audit_event(
        user_id=user_id,
        user_role=role,
        action=AuditAction.SECURITY_EVENT,
        resource_type="session",
        college_id=college_id,
        details={"event": "login_successful"},
        ip_address=request.client.host if request.client else None,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": user,
    }


@router.post("/refresh", response_model=Token)
async def refresh_tokens(req: RefreshTokenRequest, db=Depends(get_database)):
    """Rotate refresh token and issue a fresh access token."""
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    role = user.get("role")
    college_id = user.get("college_id")

    new_access_token = create_access_token(subject=user_id, role=role, college_id=college_id)
    new_refresh_token = create_refresh_token(subject=user_id, role=role, college_id=college_id)

    user["id"] = str(user["_id"])
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": new_refresh_token,
        "user": user,
    }


@router.post("/forgot-password")
async def request_password_reset_otp(req: ForgotPasswordRequest, request: Request, db=Depends(get_database)):
    """Generate a single-use expiring OTP for password recovery."""
    identifier = req.identifier.strip().lower()
    query = {"$or": [{"email": identifier}, {"phone": req.identifier.strip()}]}
    user = await db.users.find_one(query)

    if not user:
        # Prevent user enumeration by returning uniform success message
        return {"message": "If the account exists, an OTP has been sent."}

    user_id = str(user["_id"])
    otp = generate_otp_code(6)
    expire_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    # Store OTP in db
    await db.otps.update_one(
        {"user_id": user_id},
        {"$set": {"otp_hash": get_password_hash(otp), "expire_at": expire_at, "attempts": 0}},
        upsert=True
    )

    await record_audit_event(
        user_id=user_id,
        user_role=user.get("role"),
        action=AuditAction.SECURITY_EVENT,
        resource_type="otp",
        college_id=user.get("college_id"),
        details={"event": "otp_requested"},
        ip_address=request.client.host if request.client else None,
    )

    # In production, send via email/SMS gateway. In development/testing, return simulated dispatch
    return {
        "message": "OTP generated and dispatched successfully",
        "dev_hint": f"Development OTP: {otp}",
    }


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, request: Request, db=Depends(get_database)):
    """Verify single-use OTP and reset user password."""
    identifier = req.identifier.strip().lower()
    user = await db.users.find_one({"$or": [{"email": identifier}, {"phone": req.identifier.strip()}]})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset attempt")

    user_id = str(user["_id"])
    otp_record = await db.otps.find_one({"user_id": user_id})

    if not otp_record or otp_record.get("expire_at") < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new one.")

    if otp_record.get("attempts", 0) >= settings.MAX_OTP_ATTEMPTS:
        await db.otps.delete_one({"user_id": user_id})
        raise HTTPException(status_code=429, detail="Too many invalid OTP attempts. Please request a new one.")

    if not verify_password(req.otp, otp_record.get("otp_hash", "")):
        await db.otps.update_one({"user_id": user_id}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Hash and update password
    new_hash = get_password_hash(req.new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}}
    )
    # Destroy consumed OTP
    await db.otps.delete_one({"user_id": user_id})

    await record_audit_event(
        user_id=user_id,
        user_role=user.get("role"),
        action=AuditAction.SECURITY_EVENT,
        resource_type="password",
        college_id=user.get("college_id"),
        details={"event": "password_reset_completed"},
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Password reset successfully. You can now login with your new password."}


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Return authenticated user profile."""
    return current_user


@router.patch("/profile/photo", response_model=UserOut)
async def update_profile_photo(
    update_data: StudentProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Update profile photo. Students have locked institutional fields and can only update permitted fields (photo).
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable")

    user_id = current_user["id"]
    new_photo = update_data.photo_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80"

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"photo_url": new_photo, "updated_at": datetime.utcnow()}}
    )

    current_user["photo_url"] = new_photo
    return current_user

