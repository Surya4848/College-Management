from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AnnouncementRevision(BaseModel):
    title: str
    message: str
    edited_by: str
    edited_at: datetime = Field(default_factory=datetime.utcnow)
    change_summary: Optional[str] = None


class AnnouncementCreate(BaseModel):
    title: str
    message: str
    category: str = "General"  # Academic, Department, Events, General
    priority: str = "Normal"   # Normal, High
    audience: str = "College community"
    department_id: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: str
    message: str
    change_summary: str


class AnnouncementInDB(BaseModel):
    id: str = Field(alias="_id")
    college_id: str
    department_id: Optional[str] = None
    author_id: str
    author_name: str
    author_role: str
    title: str
    message: str
    category: str
    priority: str
    audience: str
    is_withdrawn: bool = False
    revisions: List[AnnouncementRevision] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

