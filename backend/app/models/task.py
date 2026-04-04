from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class TaskStatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    pending_review = "pending_review"
    completed = "completed"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_role_id = Column(Integer, ForeignKey("custom_roles.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.pending)
    due_date = Column(DateTime, nullable=True)
    evidence_note = Column(Text, nullable=True)
    sos_flag = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_role = relationship("CustomRole", back_populates="tasks")
    logs = relationship("ActivityLog", back_populates="task", cascade="all, delete-orphan")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    task = relationship("Task", back_populates="logs")
    user = relationship("User", back_populates="logs")
