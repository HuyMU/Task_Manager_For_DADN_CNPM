from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.models.user import User, RoleEnum

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username).options(selectinload(User.custom_role))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(self, user_data: dict) -> Optional[User]:
        new_user = User(**user_data)
        self.session.add(new_user)
        try:
            await self.session.commit()
            await self.session.refresh(new_user)
            return new_user
        except IntegrityError:
            await self.session.rollback()
            return None

    async def get_members(self) -> List[User]:
        stmt = select(User).where(User.role == RoleEnum.member).options(selectinload(User.custom_role)).order_by(User.username)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_reviewer_status(self, user_id: int, is_reviewer: bool) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.is_reviewer = is_reviewer
            await self.session.commit()
            return user
        return None
