from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from server.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str


@router.get("", response_model=List[TaskItem])
def list_tasks():
    return [
        {
            "id": "tsk-1",
            "title": "Configure CI/CD Pipelines",
            "description": "Set up GitHub actions workflow for automated testing",
            "status": "completed",
            "priority": "high"
        },
        {
            "id": "tsk-2",
            "title": "Integrate OpenTelemetry Tracing",
            "description": "Trace HTTP calls across frontend and microservices",
            "status": "in_progress",
            "priority": "medium"
        }
    ]
