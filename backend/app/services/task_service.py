from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.user import TokenPayload
from app.models.task import Task, TaskStatusEnum
from app.models.user import RoleEnum
from app.utils.discord import send_discord_notification
from app.core.exceptions import EntityNotFoundException

class TaskService:
    def __init__(self, session: AsyncSession):
        self.task_repo = TaskRepository(session)
        self.user_repo = UserRepository(session)

    async def _log_activity(self, task_id: int, user_id: int, action: str):
        await self.task_repo.add_activity_log(task_id, user_id, action)

    async def get_all_tasks(self) -> List[Task]:
        return await self.task_repo.get_all_tasks()

    async def get_task(self, task_id: int) -> Task:
        task = await self.task_repo.get_task_by_id(task_id)
        if not task:
            raise EntityNotFoundException("Task")
        return task

    async def create_task(self, task_data: TaskCreate, current_user: TokenPayload) -> Task:
        data = task_data.model_dump(exclude_unset=True)
        if 'status' not in data or not data['status']:
            data['status'] = TaskStatusEnum.pending
            
        task = await self.task_repo.create_task(data)
        await self._log_activity(task.id, current_user.id, "Đã tạo công việc này")
        
        await send_discord_notification(
            title=f"🚀 New Task Created: {task.title}",
            description=task.description or "*No description provided*",
            color=3066993
        )
        return task

    async def update_task(self, task_id: int, task_update: TaskUpdate, current_user: TokenPayload) -> Task:
        task = await self.get_task(task_id)
        
        update_data = task_update.model_dump(exclude_unset=True)
        old_status = task.status
        old_sos = task.sos_flag
        
        # Access control
        if current_user.role != RoleEnum.admin.value:
            # Members can only update status or sos_flag
            allowed_keys = {"status", "sos_flag"}
            if any(k not in allowed_keys for k in update_data.keys()):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Members can only update task status or SOS flag")
            
            if task.assigned_role_id is not None and task.assigned_role_id != current_user.custom_role_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to update tasks assigned to other roles")
        
        task = await self.task_repo.update_task(task, update_data)
        
        # Logging & Notifications
        if 'status' in update_data and update_data['status'] != old_status:
            await self._log_activity(task.id, current_user.id, f"Đã chuyển sang: {task.status.value}")
            if task.status == TaskStatusEnum.completed and old_status != TaskStatusEnum.completed:
                await send_discord_notification(
                    title=f"✅ Task Completed: {task.title}",
                    description=f"Task was successfully marked as **Completed** by {current_user.username}.",
                    color=3066993
                )
                
        if 'sos_flag' in update_data and update_data['sos_flag'] != old_sos:
            action_text = "Đã BẬT cờ khẩn cấp SOS 🆘" if task.sos_flag else "Đã TẮT cờ SOS"
            await self._log_activity(task.id, current_user.id, action_text)
            if task.sos_flag and not old_sos:
                await send_discord_notification(
                    title=f"🚨 SOS ALERT: {task.title}",
                    description=f"**{current_user.username}** has raised the SOS flag for this task! Immediate attention may be required.",
                    color=15158332
                )
                
        return task

    async def request_review(self, task_id: int, evidence_note: str | None, current_user: TokenPayload) -> Task:
        task = await self.get_task(task_id)
        
        if current_user.role != RoleEnum.admin.value and task.assigned_role_id is not None and task.assigned_role_id != current_user.custom_role_id:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to submit this task for review")
             
        task = await self.task_repo.update_task(task, {
            "status": TaskStatusEnum.pending_review,
            "evidence_note": evidence_note
        })
        
        note_text = "Có đính kèm evidence" if evidence_note else "Không có evidence"
        await self._log_activity(task.id, current_user.id, f"Đã gửi yêu cầu duyệt ({note_text})")
        return task

    async def review_task(self, task_id: int, action: str, current_user: TokenPayload) -> Task:
        task = await self.get_task(task_id)
        
        is_self_role_task = (task.assigned_role_id is not None and task.assigned_role_id == current_user.custom_role_id)
        can_review = current_user.role == RoleEnum.admin.value or (current_user.is_reviewer and not is_self_role_task)
        
        if not can_review:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to review this task")
            
        if action == "approve":
            task = await self.task_repo.update_task(task, {"status": TaskStatusEnum.completed})
            await self._log_activity(task.id, current_user.id, "Đã DUYỆT (Approve) công việc")
            await send_discord_notification(
                title=f"✅ Task Approved & Completed: {task.title}",
                description=f"Task was successfully reviewed and approved by **{current_user.username}**.",
                color=3066993
            )
        elif action == "reject":
            task = await self.task_repo.update_task(task, {
                "status": TaskStatusEnum.in_progress,
                "evidence_note": None
            })
            await self._log_activity(task.id, current_user.id, "Đã TỪ CHỐI (Reject) công việc")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid action. Use "approve" or "reject".')
            
        return task

    async def delete_task(self, task_id: int) -> None:
        task = await self.get_task(task_id)
        await self.task_repo.delete_task(task)
