from typing import List, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings
from app.core.security import decode_token
from app.db.mongodb import get_database
from app.models.enums import CollegeStatus, UserRole

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db=Depends(get_database)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims",
        )

    if db is None:
        # Fallback memory user for mock/offline testing
        return {
            "_id": user_id,
            "id": user_id,
            "role": payload.get("role"),
            "college_id": payload.get("college_id"),
            "name": "Authenticated User",
            "is_active": True,
        }

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or withdrawn",
        )

    # Check College activation status for non-platform monitors
    college_id = user.get("college_id")
    if college_id and user.get("role") != UserRole.PLATFORM_MONITOR:
        college = await db.colleges.find_one({"_id": ObjectId(college_id)})
        if not college or college.get("status") != CollegeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"College is not currently active (Status: {college.get('status') if college else 'Unknown'})",
            )

    user["id"] = str(user["_id"])
    return user


def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker


async def check_incharge_assignment(
    staff_user: dict,
    program: str,
    year: str,
    section: str,
    db
) -> bool:
    """Verifies whether an in-charge staff member is assigned to a specific class/section."""
    if staff_user.get("role") in [UserRole.PRINCIPAL, UserRole.HOD]:
        return True  # Principal & HOD possess administrative department scope
    
    if staff_user.get("role") != UserRole.STAFF:
        return False

    assignment = await db.staff_assignments.find_one({
        "college_id": str(staff_user.get("college_id")),
        "staff_id": str(staff_user.get("id")),
        "assigned_classes": {
            "$elemMatch": {
                "program": program,
                "year": year,
                "section": section,
            }
        }
    })
    return assignment is not None

