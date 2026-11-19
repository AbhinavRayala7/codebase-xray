import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(50), default="zip")  # "github", "zip", "sample"
    repository_url = Column(String(512), nullable=True)
    root_path = Column(String(512), nullable=False)
    default_branch = Column(String(100), default="main")
    
    # Summary stats
    total_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    primary_language = Column(String(100), default="Unknown")
    languages = Column(JSON, default=dict)  # {"Python": 65, "TypeScript": 35}
    frameworks = Column(JSON, default=list)  # ["FastAPI", "React", "Next.js"]
    health_score = Column(Integer, default=100)
    
    status = Column(String(50), default="pending")  # pending, analyzing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    files = relationship("CodeFile", back_populates="project", cascade="all, delete-orphan")
    analysis_jobs = relationship("AnalysisJob", back_populates="project", cascade="all, delete-orphan")
    investigations = relationship("AIInvestigation", back_populates="project", cascade="all, delete-orphan")
    issues = relationship("CodeIssue", back_populates="project", cascade="all, delete-orphan")


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    stage = Column(String(100), default="queued")  # queued, extracting, scanning, parsing, building_graph, checking_health, completed, failed
    progress_percent = Column(Integer, default=0)
    log_messages = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="running")

    project = relationship("Project", back_populates="analysis_jobs")


class CodeFile(Base):
    __tablename__ = "code_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    relative_path = Column(String(512), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    extension = Column(String(50), nullable=False)
    language = Column(String(100), default="Unknown")
    file_size = Column(Integer, default=0)
    line_count = Column(Integer, default=0)
    is_entry_point = Column(Boolean, default=False)
    is_config = Column(Boolean, default=False)
    is_test = Column(Boolean, default=False)
    
    # Categorization: component, api_route, service, controller, model, utility, config, entry
    role = Column(String(100), default="module")
    
    # Raw AST extracts stored as structured JSON
    imports = Column(JSON, default=list)      # [{"source": "./utils", "imported": ["formatDate"], "is_external": false}]
    exports = Column(JSON, default=list)      # [{"name": "AuthService", "type": "class"}]
    functions = Column(JSON, default=list)    # [{"name": "login", "line_start": 45, "line_end": 72, "complexity": 3}]
    classes = Column(JSON, default=list)      # [{"name": "User", "line_start": 10, "methods": [...]}]
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="files")
    dependencies_out = relationship("Dependency", foreign_keys="Dependency.source_file_id", back_populates="source_file", cascade="all, delete-orphan")
    dependencies_in = relationship("Dependency", foreign_keys="Dependency.target_file_id", back_populates="target_file", cascade="all, delete-orphan")


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    source_file_id = Column(String, ForeignKey("code_files.id"), nullable=False)
    target_file_id = Column(String, ForeignKey("code_files.id"), nullable=True)  # Null if external module
    
    imported_name = Column(String(255), nullable=False)  # Module path or package name
    symbols = Column(JSON, default=list)                # Specific imported symbols ['useState', 'Button']
    is_external = Column(Boolean, default=False)
    is_circular = Column(Boolean, default=False)

    source_file = relationship("CodeFile", foreign_keys=[source_file_id], back_populates="dependencies_out")
    target_file = relationship("CodeFile", foreign_keys=[target_file_id], back_populates="dependencies_in")


class CodeIssue(Base):
    __tablename__ = "code_issues"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    file_id = Column(String, ForeignKey("code_files.id"), nullable=True)
    file_path = Column(String(512), nullable=False)
    
    # Categories: circular_dependency, large_file, high_complexity, missing_test, high_coupling, dead_code, duplicate_import
    category = Column(String(100), nullable=False)
    severity = Column(String(50), default="medium")  # high, medium, low
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    line_number = Column(Integer, nullable=True)
    suggestion = Column(Text, nullable=True)
    is_confirmed = Column(Boolean, default=True)  # True for static proven, False for heuristic

    project = relationship("Project", back_populates="issues")


class AIInvestigation(Base):
    __tablename__ = "ai_investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    cited_files = Column(JSON, default=list)    # [{"path": "src/api/auth.ts", "lines": [20, 45], "reason": "Handles login JWT"}]
    cited_symbols = Column(JSON, default=list)  # ["handleLogin", "verifyToken"]
    uncertainty_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="investigations")
