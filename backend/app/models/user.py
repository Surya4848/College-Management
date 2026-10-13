from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from .enums import UserRole


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    institution_id: str  # Register Number or Staff ID
    department_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: UserRole
    college_code: Optional[str] = None  # Required for student/staff onboarding


class UserLogin(BaseModel):
    identifier: str  # Email or Phone
    password: str
    college_code: Optional[str] = None


class UserInDB(UserBase):
    id: str = Field(alias="_id")
    college_id: Optional[str] = None
    department_id: Optional[str] = None
    role: UserRole
    password_hash: str
    is_verified: bool = False
    is_active: bool = True
    is_approved_by_hod: bool = False
    profile_locked: bool = False
    photo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserOut(UserBase):
    id: str
    college_id: Optional[str] = None
    department_id: Optional[str] = None
    role: UserRole
    is_verified: bool
    is_active: bool
    is_approved_by_hod: bool
    profile_locked: bool
    photo_url: Optional[str] = None
    created_at: datetime


class StudentProfileUpdate(BaseModel):
    photo_url: Optional[str] = None  # Students may only edit permitted fields


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    user: UserOut


class TokenPayload(BaseModel):
    sub: str  # User ID
    college_id: Optional[str] = None
    role: UserRole
    exp: Optional[int] = None

