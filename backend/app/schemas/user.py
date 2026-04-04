from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.user import RoleEnum

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    custom_role_id: int

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role: RoleEnum
    custom_role_id: Optional[int] = None
    custom_role_name: Optional[str] = None
    is_reviewer: bool
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    token: str
    role: str
    username: str
    custom_role_id: Optional[int]
    custom_role_name: Optional[str]
    is_reviewer: bool

class TokenPayload(BaseModel):
    id: int
    username: str
    role: str
    custom_role_id: Optional[int] = None
    custom_role_name: Optional[str] = None
    is_reviewer: bool

class ReviewerUpdate(BaseModel):
    is_reviewer: bool
