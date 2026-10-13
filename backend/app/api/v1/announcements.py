from datetime import datetime
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rbac import get_current_user, require_roles
from app.db.mongodb import get_database
from app.models.announcement import AnnouncementCreate, AnnouncementInDB, AnnouncementUpdate
from app.models.enums import AuditAction, UserRole
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def publish_announcement(
    ann_in: AnnouncementCreate,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.HOD, UserRole.STAFF])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    doc = {
        "college_id": college_id,
        "department_id": ann_in.department_id,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "author_role": current_user["role"],
        "title": ann_in.title.strip(),
        "message": ann_in.message.strip(),
        "category": ann_in.category,
        "priority": ann_in.priority,
        "audience": ann_in.audience,
        "is_withdrawn": False,
        "revisions": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = await db.announcements.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.ANNOUNCEMENT_PUBLISHED,
        resource_type="announcement",
        college_id=college_id,
        resource_id=doc["id"],
        details={"title": ann_in.title, "priority": ann_in.priority},
        ip_address=request.client.host if request.client else None,
    )
    return doc


@router.put("/{ann_id}")
async def edit_announcement(
    ann_id: str,
    update_in: AnnouncementUpdate,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.HOD, UserRole.STAFF])),
    db=Depends(get_database)
):
    """Edits announcement with mandatory change_summary and append-only revision logging."""
    college_id = current_user["college_id"]
    existing = await db.announcements.find_one({"_id": ObjectId(ann_id), "college_id": college_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")

    revision_entry = {
        "title": existing["title"],
        "message": existing["message"],
        "edited_by": current_user["name"],
        "edited_at": datetime.utcnow(),
        "change_summary": update_in.change_summary.strip(),
    }

    await db.announcements.update_one(
        {"_id": ObjectId(ann_id)},
        {
            "$set": {
                "title": update_in.title.strip(),
                "message": update_in.message.strip(),
                "updated_at": datetime.utcnow(),
            },
            "$push": {"revisions": revision_entry}
        }
    )

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.ANNOUNCEMENT_MODIFIED,
        resource_type="announcement",
        college_id=college_id,
        resource_id=ann_id,
        details={"change_summary": update_in.change_summary},
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Announcement updated with revision history recorded"}


@router.delete("/{ann_id}")
async def withdraw_announcement(
    ann_id: str,
    request: Request,
    current_user: dict = Depends(require_roles([UserRole.PRINCIPAL, UserRole.HOD])),
    db=Depends(get_database)
):
    college_id = current_user["college_id"]
    res = await db.announcements.update_one(
        {"_id": ObjectId(ann_id), "college_id": college_id},
        {"$set": {"is_withdrawn": True, "updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    await record_audit_event(
        user_id=current_user["id"],
        user_role=current_user["role"],
        action=AuditAction.ANNOUNCEMENT_WITHDRAWN,
        resource_type="announcement",
        college_id=college_id,
        resource_id=ann_id,
        ip_address=request.client.host if request.client else None,
    )
    return {"message": "Announcement withdrawn"}


@router.get("")
async def list_announcements(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    college_id = current_user.get("college_id")
    if not college_id:
        return []
    cursor = db.announcements.find({"college_id": college_id, "is_withdrawn": False}).sort("created_at", -1)
    announcements = []
    async for a in cursor:
        a["id"] = str(a["_id"])
        announcements.append(a)
    return announcements

