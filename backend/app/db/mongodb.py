import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


class MongoDBManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_manager = MongoDBManager()


async def get_database() -> AsyncIOMotorDatabase:
    return db_manager.db


async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
        # Test connection
        await client.admin.command('ping')
        db_manager.client = client
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        await init_indexes()
        logger.info("Successfully connected to live MongoDB and verified indexes.")
    except Exception as e:
        logger.warning(f"Could not connect to live MongoDB ({e}). Falling back to in-memory MongoDB engine.")
        try:
            from mongomock_motor import AsyncMongoMockClient
            from seed_demo import seed_database
            db_manager.client = AsyncMongoMockClient()
            db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
            await init_indexes()
            await seed_database(db_manager.db)
            logger.info("In-memory MongoDB initialized and demo data loaded successfully.")
        except Exception as seed_err:
            logger.error(f"Error initializing in-memory database: {seed_err}")


async def close_mongo_connection():
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()


async def init_indexes():
    if db_manager.db is None:
        return
    db = db_manager.db

    # Colleges
    await db.colleges.create_index("college_code", unique=True, sparse=True)
    await db.colleges.create_index("registration_number", unique=True)
    await db.colleges.create_index("status")

    # Users
    await db.users.create_index([("college_id", 1), ("email", 1)], unique=True, sparse=True)
    await db.users.create_index([("college_id", 1), ("institution_id", 1)], unique=True, sparse=True)
    await db.users.create_index("role")

    # Staff Assignments
    await db.staff_assignments.create_index([("college_id", 1), ("staff_id", 1)])
    await db.staff_assignments.create_index("department_id")

    # Attendance
    await db.attendance_records.create_index(
        [("college_id", 1), ("student_id", 1), ("date", 1)],
        unique=True
    )
    await db.attendance_records.create_index([("college_id", 1), ("date", 1)])

    # Attendance Corrections
    await db.attendance_corrections.create_index([("college_id", 1), ("status", 1)])

    # Announcements
    await db.announcements.create_index([("college_id", 1), ("created_at", -1)])

    # Complaints
    await db.complaints.create_index("ticket_number", unique=True)
    await db.complaints.create_index([("college_id", 1), ("status", 1)])

    # Audit Logs
    await db.audit_logs.create_index([("college_id", 1), ("timestamp", -1)])
    await db.audit_logs.create_index("action")
