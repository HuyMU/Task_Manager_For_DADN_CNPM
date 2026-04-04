from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.models.user import CustomRole

class RoleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_roles(self) -> List[CustomRole]:
        stmt = select(CustomRole).order_by(CustomRole.name)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_role(self, name: str) -> Optional[CustomRole]:
        new_role = CustomRole(name=name)
        self.session.add(new_role)
        try:
            await self.session.commit()
            await self.session.refresh(new_role)
            return new_role
        except IntegrityError:
            await self.session.rollback()
            return None
