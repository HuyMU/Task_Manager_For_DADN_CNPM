from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.user import UserOut, ReviewerUpdate, TokenPayload
from app.services.user_service import UserService
from app.dependencies.database import get_db
from app.dependencies.auth import require_admin

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=List[UserOut])
async def get_users(
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    user_service = UserService(session)
    users = await user_service.get_users()
    
    # We need to map custom_role_name for UserOut
    result = []
    for user in users:
        u_out = UserOut.model_validate(user)
        if user.custom_role:
            u_out.custom_role_name = user.custom_role.name
        result.append(u_out)
    return result

@router.put("/{user_id}/reviewer")
async def update_reviewer(
    user_id: int, 
    reviewer_data: ReviewerUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    user_service = UserService(session)
    await user_service.update_reviewer(user_id, reviewer_data.is_reviewer)
    return {"message": "Reviewer status updated"}
