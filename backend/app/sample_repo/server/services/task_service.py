import uuid
from typing import List, Optional
from server.models.database import Task
from server.utils.logger import get_logger

logger = get_logger("task_service")


class TaskService:
    def __init__(self, db_session):
        self.db = db_session

    def list_tasks(self, owner_id: Optional[str] = None) -> List[Task]:
        query = self.db.query(Task)
        if owner_id:
            query = query.filter(Task.owner_id == owner_id)
        return query.all()

    def create_task(self, title: str, description: str, owner_id: str, priority: str = "medium") -> Task:
        logger.info(f"Creating task '{title}' for owner {owner_id}")
        task = Task(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            owner_id=owner_id,
            priority=priority,
            status="todo"
        )
        self.db.add(task)
        self.db.commit()
        return task

    def update_task_status(self, task_id: str, new_status: str) -> Optional[Task]:
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        task.status = new_status
        self.db.commit()
        return task
