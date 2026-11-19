from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.db.session import get_db
from app.models.database import Project, CodeFile, CodeIssue
from app.analyzer.dependency_graph import DependencyEngine
from app.analyzer.parsers.base import ParsedFileResult, ImportInfo, ExportInfo, FunctionInfo, ClassInfo

router = APIRouter(prefix="/api/projects/{project_id}", tags=["analysis"])


def _reconstruct_parsed_files(code_files: List[CodeFile]) -> List[ParsedFileResult]:
    results = []
    for cf in code_files:
        imports = [ImportInfo(**i) for i in (cf.imports or [])]
        exports = [ExportInfo(**e) for e in (cf.exports or [])]
        functions = [FunctionInfo(**fn) for fn in (cf.functions or [])]
        classes = [ClassInfo(**c) for c in (cf.classes or [])]

        results.append(ParsedFileResult(
            relative_path=cf.relative_path,
            file_name=cf.file_name,
            extension=cf.extension,
            language=cf.language,
            line_count=cf.line_count,
            file_size=cf.file_size,
            is_entry_point=cf.is_entry_point,
            is_config=cf.is_config,
            is_test=cf.is_test,
            role=cf.role,
            imports=imports,
            exports=exports,
            functions=functions,
            classes=classes
        ))
    return results


@router.get("/architecture")
def get_architecture(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    engine = DependencyEngine(parsed_files)
    react_flow_data = engine.to_react_flow()

    return react_flow_data


@router.get("/dependencies")
def get_dependencies_overview(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    engine = DependencyEngine(parsed_files)

    return {
        "circular_dependencies": engine.get_circular_dependencies(),
        "hub_modules": engine.get_hub_modules(top_n=8),
        "bottlenecks": engine.get_architectural_bottlenecks(top_n=8),
        "external_packages": list(engine.external_packages)
    }


@router.get("/dependencies/{file_path:path}")
def get_file_dependencies(project_id: str, file_path: str, db: Session = Depends(get_db)):
    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    engine = DependencyEngine(parsed_files)

    data = engine.get_file_dependencies(file_path)
    return data


@router.get("/impact")
def get_change_impact(project_id: str, file_path: str = Query(...), db: Session = Depends(get_db)):
    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    parsed_files = _reconstruct_parsed_files(code_files)
    engine = DependencyEngine(parsed_files)

    data = engine.analyze_change_impact(file_path)
    return data


@router.get("/health")
def get_health_report(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    issues = db.query(CodeIssue).filter(CodeIssue.project_id == project_id).all()
    category_counts = {}
    severity_counts = {"high": 0, "medium": 0, "low": 0}

    issues_list = []
    for iss in issues:
        category_counts[iss.category] = category_counts.get(iss.category, 0) + 1
        sev = iss.severity.lower() if iss.severity else "medium"
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        issues_list.append({
            "id": iss.id,
            "category": iss.category,
            "severity": iss.severity,
            "title": iss.title,
            "description": iss.description,
            "file_path": iss.file_path,
            "line_number": iss.line_number,
            "suggestion": iss.suggestion,
            "is_confirmed": iss.is_confirmed
        })

    return {
        "health_score": project.health_score,
        "total_issues": len(issues_list),
        "severity_breakdown": severity_counts,
        "category_breakdown": category_counts,
        "issues": issues_list
    }
