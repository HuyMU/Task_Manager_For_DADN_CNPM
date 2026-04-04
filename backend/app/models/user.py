from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    member = "member"

class CustomRole(Base):
    __tablename__ = "custom_roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="custom_role")
    tasks = relationship("Task", back_populates="assigned_role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member)
    custom_role_id = Column(Integer, ForeignKey("custom_roles.id", ondelete="SET NULL"), nullable=True)
    is_reviewer = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    custom_role = relationship("CustomRole", back_populates="users")
    logs = relationship("ActivityLog", back_populates="user")
