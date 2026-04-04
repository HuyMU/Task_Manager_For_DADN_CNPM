from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.task import TaskOut, TaskCreate, TaskUpdate, TaskDetailOut, ReviewRequest, ReviewAction
from app.schemas.user import TokenPayload
from app.services.task_service import TaskService
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(tags=["tasks"])

# Note: The original node app has GET /tasks, POST /tasks, PUT /tasks/:id, PUT /tasks/:id/request-review, PUT /tasks/:id/review, DELETE /tasks/:id
# But also GET /api/tasks/:id. We match these exact paths.

@router.get("/tasks", response_model=List[TaskOut])
async def get_tasks(
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    task_service = TaskService(session)
    tasks = await task_service.get_all_tasks()
    
    result = []
    for task in tasks:
        t_out = TaskOut.model_validate(task)
        if task.assigned_role:
            t_out.assigned_role_name = task.assigned_role.name
        result.append(t_out)
    return result

@router.get("/api/tasks/{task_id}", response_model=TaskDetailOut)
async def get_task_detail(
    task_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    task_service = TaskService(session)
    task = await task_service.get_task(task_id)
    
    t_out = TaskDetailOut.model_validate(task)
    if task.assigned_role:
        t_out.assigned_role_name = task.assigned_role.name
        
    for log_out, log in zip(t_out.logs, task.logs):
        log_out.username = log.user.username
        
    # Sort logs by created_at DESC to match the original SQL query
    t_out.logs.sort(key=lambda x: x.created_at, reverse=True)
    return t_out

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    task_service = TaskService(session)
    task = await task_service.create_task(task_data, current_user)
    return {"message": "Task created successfully", "taskId": task.id}

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    task_service = TaskService(session)
    await task_service.update_task(task_id, task_update, current_user)
    return {"message": "Task updated successfully"}

@router.put("/tasks/{task_id}/request-review")
async def request_review(
    task_id: int,
    review_req: ReviewRequest,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    task_service = TaskService(session)
    await task_service.request_review(task_id, review_req.evidence_note, current_user)
    return {"message": "Task submitted for review"}

@router.put("/tasks/{task_id}/review")
async def review_task(
    task_id: int,
    action_reg: ReviewAction,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    task_service = TaskService(session)
    await task_service.review_task(task_id, action_reg.action, current_user)
    msg = "Task approved" if action_reg.action == "approve" else "Task rejected"
    return {"message": msg}

@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(require_admin)
):
    task_service = TaskService(session)
    await task_service.delete_task(task_id)
    return {"message": "Task deleted successfully"}
