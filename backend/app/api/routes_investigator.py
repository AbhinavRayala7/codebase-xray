from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.db.session import get_db
from app.models.database import Project, AIInvestigation
from app.ai.investigator import AIInvestigator

router = APIRouter(prefix="/api/projects/{project_id}/investigate", tags=["investigator"])


class InvestigateRequest(BaseModel):
    query: str


@router.post("")
async def investigate_codebase(
    project_id: str,
    request: InvestigateRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    investigator = AIInvestigator(db, project)
    result = await investigator.investigate(request.query)
    return result


@router.get("/history")
def get_investigation_history(project_id: str, db: Session = Depends(get_db)):
    investigations = (
        db.query(AIInvestigation)
        .filter(AIInvestigation.project_id == project_id)
        .order_by(AIInvestigation.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": inv.id,
            "query": inv.query,
            "response": inv.response,
            "cited_files": inv.cited_files or [],
            "cited_symbols": inv.cited_symbols or [],
            "uncertainty_note": inv.uncertainty_note,
            "created_at": inv.created_at.isoformat() if inv.created_at else ""
        }
        for inv in investigations
    ]
