from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List
from app.repositories.role_repository import RoleRepository
from app.schemas.user import RoleCreate
from app.models.user import CustomRole

class RoleService:
    def __init__(self, session: AsyncSession):
        self.role_repo = RoleRepository(session)

    async def get_roles(self) -> List[CustomRole]:
        return await self.role_repo.get_all_roles()

    async def create_role(self, role_data: RoleCreate) -> CustomRole:
        role = await self.role_repo.create_role(role_data.name)
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role already exists")
        return role
