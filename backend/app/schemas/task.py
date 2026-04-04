from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.task import TaskStatusEnum
from app.schemas.user import UserOut

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_role_id: Optional[int] = None
    status: Optional[TaskStatusEnum] = TaskStatusEnum.pending
    due_date: Optional[datetime] = None
    sos_flag: Optional[bool] = False

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_role_id: Optional[int] = None
    status: Optional[TaskStatusEnum] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_role_id: Optional[int] = None
    status: Optional[TaskStatusEnum] = None
    due_date: Optional[datetime] = None
    sos_flag: Optional[bool] = None

class ReviewRequest(BaseModel):
    evidence_note: Optional[str] = None

class ReviewAction(BaseModel):
    action: str # "approve" or "reject"

class ActivityLogOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    action: str
    created_at: datetime
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TaskOut(TaskBase):
    id: int
    evidence_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assigned_role_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TaskDetailOut(TaskOut):
    logs: List[ActivityLogOut] = []
