from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate, UserLogin, Token
from app.services.auth_service import AuthService
from app.dependencies.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, session: AsyncSession = Depends(get_db)):
    auth_service = AuthService(session)
    await auth_service.register(user_data)
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, session: AsyncSession = Depends(get_db)):
    auth_service = AuthService(session)
    return await auth_service.login(login_data)
