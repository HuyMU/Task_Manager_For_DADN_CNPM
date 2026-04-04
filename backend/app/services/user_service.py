from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.core.exceptions import EntityNotFoundException

class UserService:
    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)

    async def get_users(self) -> List[User]:
        return await self.user_repo.get_members()

    async def update_reviewer(self, user_id: int, is_reviewer: bool) -> User:
        user = await self.user_repo.update_reviewer_status(user_id, is_reviewer)
        if not user:
            raise EntityNotFoundException("User")
        return user
