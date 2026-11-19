from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.database import Project, CodeFile
from app.analyzer.execution_tracer import ExecutionTracer
from app.api.routes_analysis import _reconstruct_parsed_files

router = APIRouter(prefix="/api/projects/{project_id}/trace", tags=["tracer"])


class TraceRequest(BaseModel):
    query: str


@router.get("/flows")
def get_suggested_flows(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    tracer = ExecutionTracer(parsed_files)

    return {"flows": tracer.get_suggested_flows()}


@router.post("")
def trace_execution(project_id: str, request: TraceRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    tracer = ExecutionTracer(parsed_files)

    result = tracer.trace_flow(request.query)
    return result
