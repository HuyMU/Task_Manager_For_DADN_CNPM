import asyncio
from app.database import async_session_maker
from app.models.user import User
from sqlalchemy.future import select
from app.core.security import verify_password

async def main():
    async with async_session_maker() as session:
        res = await session.execute(select(User).where(User.username == 'admin'))
        u = res.scalar_one_or_none()
        if u:
            print(f"Admin found! Hash: {u.password}")
            try:
                valid = verify_password('123456', u.password)
                print(f"Password validated: {valid}")
            except Exception as e:
                print(f"Validate err: {e}")
        else:
            print("No admin user found. DB might not be seeded or the query fails.")

if __name__ == "__main__":
    asyncio.run(main())
