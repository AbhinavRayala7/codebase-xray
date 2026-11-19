import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.config import settings, STORAGE_DIR, UPLOAD_DIR, REPOS_DIR
from app.models.database import Project, AnalysisJob, CodeFile, CodeIssue
from app.analyzer.engine import RepositoryEngine

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    source_type: str
    repository_url: Optional[str] = None
    total_files: int
    total_lines: int
    primary_language: str
    health_score: int
    status: str
    created_at: str

    class Config:
        from_attributes = True


class GitHubAnalyzeRequest(BaseModel):
    url: str
    name: Optional[str] = None


@router.get("", response_model=List[dict])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        results.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "source_type": p.source_type,
            "repository_url": p.repository_url,
            "total_files": p.total_files,
            "total_lines": p.total_lines,
            "primary_language": p.primary_language,
            "health_score": p.health_score,
            "languages": p.languages or {},
            "frameworks": p.frameworks or [],
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else ""
        })
    return results


@router.get("/stats")
def get_global_stats(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_files = sum(p.total_files for p in db.query(Project).all())
    total_issues = db.query(CodeIssue).count()
    return {
        "total_projects": total_projects,
        "total_files": total_files,
        "total_issues": total_issues
    }


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "source_type": project.source_type,
        "repository_url": project.repository_url,
        "total_files": project.total_files,
        "total_lines": project.total_lines,
        "primary_language": project.primary_language,
        "languages": project.languages or {},
        "frameworks": project.frameworks or [],
        "health_score": project.health_score,
        "status": project.status,
        "created_at": project.created_at.isoformat() if project.created_at else "",
        "error_message": project.error_message
    }


@router.get("/{project_id}/job")
def get_project_job(project_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.project_id == project_id).order_by(AnalysisJob.started_at.desc()).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return {
        "id": job.id,
        "stage": job.stage,
        "progress_percent": job.progress_percent,
        "status": job.status,
        "log_messages": job.log_messages or [],
        "started_at": job.started_at.isoformat() if job.started_at else "",
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }


import threading

def _run_analysis_task(project_id: str, source_path: Path):
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        job = db.query(AnalysisJob).filter(AnalysisJob.project_id == project_id).first()
        if project and job:
            engine = RepositoryEngine(db, project, job)
            engine.execute_analysis(source_path)
    finally:
        db.close()


@router.post("/upload-zip")
async def upload_zip_project(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported.")

    project_name = name or Path(file.filename).stem
    project_id = str(uuid.uuid4())
    proj_dir = REPOS_DIR / project_id
    proj_dir.mkdir(parents=True, exist_ok=True)

    zip_path = UPLOAD_DIR / f"{project_id}_{file.filename}"
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Check zip size
    file_size_mb = zip_path.stat().st_size / (1024 * 1024)
    if file_size_mb > settings.MAX_ZIP_SIZE_MB:
        zip_path.unlink()
        raise HTTPException(status_code=400, detail=f"ZIP file exceeds maximum allowed size ({settings.MAX_ZIP_SIZE_MB}MB).")

    project = Project(
        id=project_id,
        name=project_name,
        source_type="zip",
        root_path=str(proj_dir),
        status="analyzing"
    )
    db.add(project)

    job = AnalysisJob(
        project_id=project_id,
        stage="queued",
        progress_percent=5,
        log_messages=["[QUEUED] ZIP uploaded. Initializing security sandbox..."],
        status="running"
    )
    db.add(job)
    db.commit()

    threading.Thread(target=_run_analysis_task, args=(project_id, zip_path), daemon=True).start()

    return {"project_id": project_id, "status": "analyzing", "name": project_name}


@router.post("/github")
async def analyze_github_repo(
    request: GitHubAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    clean_url = request.url.strip()
    if not clean_url.startswith("https://github.com/"):
        raise HTTPException(status_code=400, detail="Must be a valid https://github.com/owner/repo URL")

    repo_parts = clean_url.rstrip("/").split("/")
    repo_name = request.name or repo_parts[-1]

    project_id = str(uuid.uuid4())
    proj_dir = REPOS_DIR / project_id
    proj_dir.mkdir(parents=True, exist_ok=True)

    project = Project(
        id=project_id,
        name=repo_name,
        source_type="github",
        repository_url=clean_url,
        root_path=str(proj_dir),
        status="analyzing"
    )
    db.add(project)

    job = AnalysisJob(
        project_id=project_id,
        stage="queued",
        progress_percent=5,
        log_messages=["[QUEUED] Connecting to GitHub repository..."],
        status="running"
    )
    db.add(job)
    db.commit()

    threading.Thread(target=_run_analysis_task, args=(project_id, proj_dir), daemon=True).start()

    return {"project_id": project_id, "status": "analyzing", "name": repo_name}


@router.post("/sample")
async def analyze_sample_project(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Instantly spins up and analyzes the built-in TaskFlow Fullstack sample project."""
    sample_src = Path(__file__).resolve().parent.parent / "sample_repo"
    project_id = str(uuid.uuid4())
    proj_dir = REPOS_DIR / project_id

    # Copy sample repo contents to unique project dir
    shutil.copytree(sample_src, proj_dir, dirs_exist_ok=True)

    project = Project(
        id=project_id,
        name="TaskFlow Fullstack (Demo)",
        description="Full-stack TypeScript React & Python FastAPI architecture with authentication, tasks, services, and tests.",
        source_type="sample",
        root_path=str(proj_dir),
        status="analyzing"
    )
    db.add(project)

    job = AnalysisJob(
        project_id=project_id,
        stage="queued",
        progress_percent=10,
        log_messages=["[QUEUED] Loading sample multi-tier fullstack project..."],
        status="running"
    )
    db.add(job)
    db.commit()

    threading.Thread(target=_run_analysis_task, args=(project_id, proj_dir), daemon=True).start()

    return {"project_id": project_id, "status": "analyzing", "name": project.name}


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clean up directory on disk
    try:
        p_dir = Path(project.root_path)
        if p_dir.exists():
            shutil.rmtree(p_dir, ignore_errors=True)
    except Exception:
        pass

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
