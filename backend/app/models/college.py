from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from .enums import CollegeStatus


class CollegeBase(BaseModel):
    name: str
    university_base: str
    registration_number: str
    principal_name: str
    principal_email: EmailStr
    principal_phone: str


class CollegeRegisterRequest(CollegeBase):
    proof_document_url: str  # Uploaded proof of affiliation/accreditation
    principal_password: str = Field(min_length=8)


class CollegeVerificationAction(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    reason: Optional[str] = None


class CollegeInDB(CollegeBase):
    id: str = Field(alias="_id")
    proof_document_url: str
    college_code: str  # Secure code generated for onboarding
    status: CollegeStatus = CollegeStatus.PENDING_VERIFICATION
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class CollegeOut(CollegeBase):
    id: str
    status: CollegeStatus
    proof_document_url: str
    created_at: datetime
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    # Notice: college_code is never exposed to unauthenticated public API


class CollegeWithCode(CollegeOut):
    college_code: str  # Only visible to Principal after activation

