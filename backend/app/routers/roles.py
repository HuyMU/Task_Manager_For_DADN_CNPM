from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.user import RoleOut, RoleCreate, TokenPayload
from app.services.role_service import RoleService
from app.dependencies.database import get_db
from app.dependencies.auth import require_admin

router = APIRouter(prefix="/api/roles", tags=["roles"])

@router.get("", response_model=List[RoleOut])
async def get_roles(session: AsyncSession = Depends(get_db)):
    role_service = RoleService(session)
    return await role_service.get_roles()

@router.post("", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate, 
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    role_service = RoleService(session)
    # The express code sends { message: 'Role created', roleId: ... }
    # To match fully or just use standard REST:
    role = await role_service.create_role(role_data)
    return role  # or custom dict depending on strict compat. Express app expects a dict with roleId? Wait, the frontend code usually takes whatever. Let's return RoleOut. Wait, checking the app.js: `res.status(201).json({ message: 'Role created', roleId: result.insertId });` We can return a dict to match perfectly.
    # Actually if frontend uses `data.roleId` we should return that. I will return a dict matching that perfectly.
    
# Let's override the response for exact matching
@router.post("/_exact", include_in_schema=False)
async def create_role_exact(
    role_data: RoleCreate, 
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    role_service = RoleService(session)
    role = await role_service.create_role(role_data)
    return {"message": "Role created", "roleId": role.id}

# Let's just use the exact match on the main endpoint to ensure no breaks.
router.routes.remove(router.routes[-1])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate, 
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    role_service = RoleService(session)
    role = await role_service.create_role(role_data)
    return {"message": "Role created", "roleId": role.id}
