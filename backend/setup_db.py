import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base, DATABASE_URL
from app.models.user import User, CustomRole, RoleEnum
from app.models.task import Task, ActivityLog
from app.core.security import get_password_hash
from app.database import async_session_maker

async def init_db():
    print("Setting up the database tables...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating new tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as session:
        from sqlalchemy.future import select
        # Seed default admin account
        print("Checking for default admin...")
        stmt = select(User).where(User.username == "admin")
        result = await session.execute(stmt)
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("Seeding default admin account...")
            hashed_password = get_password_hash("123456")
            new_admin = User(username="admin", password=hashed_password, role=RoleEnum.admin)
            session.add(new_admin)
            await session.commit()
            print("Admin seeded: User: [admin] / Password: [123456]")
            
    await engine.dispose()
    print("Database and tables have been initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
