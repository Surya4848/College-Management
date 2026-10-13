import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.enums import AttendanceStatus, CollegeStatus, ComplaintCategory, ComplaintStatus, UserRole


async def seed_database(db):
    print("Seeding database...")
    await db.colleges.delete_many({})
    await db.users.delete_many({})
    await db.departments.delete_many({})
    await db.staff_assignments.delete_many({})
    await db.attendance_records.delete_many({})
    await db.announcements.delete_many({})
    await db.complaints.delete_many({})
    await db.audit_logs.delete_many({})

    password_hash = get_password_hash("Password@123")

    # 1. Platform Monitor
    monitor_res = await db.users.insert_one({
        "role": UserRole.PLATFORM_MONITOR,
        "name": "State Education Monitor",
        "email": "monitor@platform.edu",
        "phone": "+91 99999 00000",
        "institution_id": "MON-GOV-01",
        "password_hash": password_hash,
        "is_verified": True,
        "is_active": True,
        "is_approved_by_hod": True,
        "profile_locked": True,
        "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&h=240&q=80",
        "created_at": datetime.utcnow(),
    })
    monitor_id = str(monitor_res.inserted_id)

    # 2. Approved College
    college_res = await db.colleges.insert_one({
        "name": "Sri Balaji Chockalingam Engineering College",
        "university_base": "Anna University",
        "registration_number": "SBC-ENG-1999",
        "proof_document_url": "https://example.com/proofs/sbc_anna_univ_affiliation.pdf",
        "college_code": "COLL-DEMO-2026",
        "status": CollegeStatus.ACTIVE,
        "principal_name": "Dr. R. Natarajan",
        "principal_email": "principal@college.edu",
        "principal_phone": "+91 94444 11111",
        "verified_by": monitor_id,
        "verified_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    })
    college_id = str(college_res.inserted_id)

    # 3. Principal User
    principal_res = await db.users.insert_one({
        "college_id": college_id,
        "role": UserRole.PRINCIPAL,
        "name": "Dr. R. Natarajan",
        "email": "principal@college.edu",
        "phone": "+91 94444 11111",
        "institution_id": "PRIN-001",
        "password_hash": password_hash,
        "is_verified": True,
        "is_active": True,
        "is_approved_by_hod": True,
        "profile_locked": True,
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80",
        "created_at": datetime.utcnow(),
    })
    principal_id = str(principal_res.inserted_id)

    # 4. Department
    dept_res = await db.departments.insert_one({
        "college_id": college_id,
        "name": "Information Technology",
        "code": "IT",
        "created_at": datetime.utcnow(),
    })
    dept_id = str(dept_res.inserted_id)

    # 5. HOD User
    hod_res = await db.users.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "department_name": "Information Technology",
        "role": UserRole.HOD,
        "name": "Dr. S. Meenakshi",
        "email": "hod.it@college.edu",
        "phone": "+91 98888 22222",
        "institution_id": "HOD-IT-01",
        "password_hash": password_hash,
        "is_verified": True,
        "is_active": True,
        "is_approved_by_hod": True,
        "profile_locked": True,
        "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&h=240&q=80",
        "created_at": datetime.utcnow(),
    })
    hod_id = str(hod_res.inserted_id)
    await db.departments.update_one({"_id": dept_res.inserted_id}, {"$set": {"hod_id": hod_id}})

    # 6. Staff User
    staff_res = await db.users.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "department_name": "Information Technology",
        "role": UserRole.STAFF,
        "name": "Dr. Arun Kumar",
        "email": "arun.kumar@college.edu",
        "phone": "+91 98765 43210",
        "institution_id": "SBCIT-FAC-001",
        "password_hash": password_hash,
        "is_verified": True,
        "is_active": True,
        "is_approved_by_hod": True,
        "profile_locked": False,
        "photo_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&h=240&q=85",
        "created_at": datetime.utcnow(),
    })
    staff_id = str(staff_res.inserted_id)

    # 7. Staff In-Charge Assignment
    await db.staff_assignments.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "staff_id": staff_id,
        "assigned_classes": [
            {"program": "B.Tech IT", "year": "III", "section": "A", "subject": "Cloud Computing"},
            {"program": "B.Tech IT", "year": "III", "section": "B", "subject": "Web Security"},
        ],
        "created_by": hod_id,
        "updated_at": datetime.utcnow(),
    })

    # 8. Student User
    student_res = await db.users.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "department_name": "Information Technology",
        "role": UserRole.STUDENT,
        "name": "Surya M",
        "email": "surya.m@college.edu",
        "phone": "+91 91234 56789",
        "institution_id": "23IT001",
        "password_hash": password_hash,
        "is_verified": True,
        "is_active": True,
        "is_approved_by_hod": True,
        "profile_locked": True,  # Student institutional fields locked
        "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80",
        "created_at": datetime.utcnow(),
    })
    student_id = str(student_res.inserted_id)

    # 9. Attendance Record
    await db.attendance_records.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "student_id": student_id,
        "date": "2026-10-12",
        "section": "A",
        "status": AttendanceStatus.PRESENT,
        "marked_by": staff_id,
        "audits": [],
        "created_at": datetime.utcnow(),
    })

    # 10. Announcement
    await db.announcements.insert_one({
        "college_id": college_id,
        "department_id": dept_id,
        "author_id": principal_id,
        "author_name": "Dr. R. Natarajan",
        "author_role": "principal",
        "title": "Anna University Odd-Semester Examination Schedule",
        "message": "The official timetable for November/December 2026 university examinations has been promulgated.",
        "category": "Academic",
        "priority": "High",
        "audience": "College community",
        "is_withdrawn": False,
        "revisions": [],
        "created_at": datetime.utcnow(),
    })

    # 11. Complaint Ticket
    await db.complaints.insert_one({
        "ticket_number": "TKT-2026-1001",
        "college_id": college_id,
        "department_id": dept_id,
        "is_anonymous": True,
        "student_id": student_id,
        "student_name": "Anonymous Student",
        "category": ComplaintCategory.INFRASTRUCTURE,
        "subject": "Lab 2 AC malfunction and network dropouts",
        "description": "During afternoon practical sessions, workstations in row 3 frequently lose connection.",
        "attachments": [],
        "status": ComplaintStatus.IN_REVIEW,
        "assigned_to": staff_id,
        "assigned_to_name": "Dr. Arun Kumar",
        "reassignments": [],
        "status_history": [],
        "created_at": datetime.utcnow(),
    })

    print("Seed completed successfully!")
    print(f"College Code: COLL-DEMO-2026")
    print(f"Monitor:    monitor@platform.edu / Password@123")
    print(f"Principal:  principal@college.edu / Password@123")
    print(f"HOD:        hod.it@college.edu / Password@123")
    print(f"Staff:      arun.kumar@college.edu / Password@123")
    print(f"Student:    surya.m@college.edu / Password@123")


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await seed_database(db)


if __name__ == "__main__":
    asyncio.run(seed())

