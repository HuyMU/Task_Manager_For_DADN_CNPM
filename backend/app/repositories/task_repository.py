from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from app.models.task import Task, ActivityLog, TaskStatusEnum

class TaskRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_tasks(self) -> List[Task]:
        # Joined load the assigned role to easily assemble response
        stmt = select(Task).options(joinedload(Task.assigned_role))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_task_by_id(self, task_id: int) -> Optional[Task]:
        # To fetch logs efficiently we can use selectinload
        stmt = select(Task).where(Task.id == task_id).options(
            joinedload(Task.assigned_role),
            selectinload(Task.logs).joinedload(ActivityLog.user)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_task(self, task_data: dict) -> Task:
        new_task = Task(**task_data)
        self.session.add(new_task)
        await self.session.flush()
        return new_task

    async def update_task(self, task: Task, update_data: dict) -> Task:
        for key, value in update_data.items():
            setattr(task, key, value)
        await self.session.flush()
        return task

    async def delete_task(self, task: Task):
        await self.session.delete(task)
        await self.session.flush()

    async def add_activity_log(self, task_id: int, user_id: int, action: str) -> ActivityLog:
        log = ActivityLog(task_id=task_id, user_id=user_id, action=action)
        self.session.add(log)
        await self.session.flush()
        return log
