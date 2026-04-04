from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import RoleEnum

class AuthService:
    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)

    async def register(self, user_data: UserCreate) -> None:
        existing_user = await self.user_repo.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        
        hashed_password = get_password_hash(user_data.password)
        create_data = {
            "username": user_data.username,
            "password": hashed_password,
            "role": RoleEnum.member,
            "custom_role_id": user_data.custom_role_id
        }
        
        new_user = await self.user_repo.create_user(create_data)
        if not new_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user (foreign key failure possibly)")

    async def login(self, login_data: UserLogin) -> Token:
        user = await self.user_repo.get_user_by_username(login_data.username)
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
        
        role_name = user.custom_role.name if user.custom_role else None
        
        token_payload = {
            "id": user.id,
            "username": user.username,
            "role": str(user.role.value),
            "custom_role_id": user.custom_role_id,
            "custom_role_name": role_name,
            "is_reviewer": user.is_reviewer
        }
        
        access_token = create_access_token(data=token_payload)
        
        return Token(
            token=access_token,
            role=str(user.role.value),
            username=user.username,
            custom_role_id=user.custom_role_id,
            custom_role_name=role_name,
            is_reviewer=user.is_reviewer
        )
