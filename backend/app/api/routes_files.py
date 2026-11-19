from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.database import Project, CodeFile

router = APIRouter(prefix="/api/projects/{project_id}/files", tags=["files"])


def build_file_tree(paths: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Builds nested folder/file tree hierarchy from flat relative paths."""
    tree: Dict[str, Any] = {}
    for item in paths:
        parts = item["path"].replace("\\", "/").split("/")
        curr = tree
        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # File leaf
                curr[part] = {
                    "name": part,
                    "path": item["path"],
                    "is_directory": False,
                    "language": item.get("language"),
                    "role": item.get("role"),
                    "line_count": item.get("line_count"),
                    "is_entry_point": item.get("is_entry_point"),
                }
            else:
                if part not in curr:
                    curr[part] = {
                        "name": part,
                        "path": "/".join(parts[:i+1]),
                        "is_directory": True,
                        "children": {}
                    }
                curr = curr[part]["children"]

    def _convert_dict_to_list(node_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes = []
        for key, val in sorted(node_dict.items(), key=lambda x: (not x[1]["is_directory"], x[0])):
            if val["is_directory"]:
                nodes.append({
                    "name": val["name"],
                    "path": val["path"],
                    "is_directory": True,
                    "children": _convert_dict_to_list(val["children"])
                })
            else:
                nodes.append(val)
        return nodes

    return _convert_dict_to_list(tree)


@router.get("")
def get_project_files_tree(project_id: str, db: Session = Depends(get_db)):
    code_files = db.query(CodeFile).filter(CodeFile.project_id == project_id).all()
    paths = [
        {
            "path": cf.relative_path,
            "language": cf.language,
            "role": cf.role,
            "line_count": cf.line_count,
            "is_entry_point": cf.is_entry_point
        }
        for cf in code_files
    ]
    tree = build_file_tree(paths)
    return {"tree": tree, "total_files": len(code_files)}


@router.get("/details/{file_path:path}")
def get_file_details(project_id: str, file_path: str, db: Session = Depends(get_db)):
    norm_path = file_path.replace("\\", "/").strip("/")
    cf = (
        db.query(CodeFile)
        .filter(CodeFile.project_id == project_id)
        .filter(CodeFile.relative_path == norm_path)
        .first()
    )
    if not cf:
        # Case insensitive fallback
        cf = (
            db.query(CodeFile)
            .filter(CodeFile.project_id == project_id)
            .filter(CodeFile.relative_path.ilike(norm_path))
            .first()
        )
    if not cf:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found in project")

    return {
        "id": cf.id,
        "relative_path": cf.relative_path,
        "file_name": cf.file_name,
        "extension": cf.extension,
        "language": cf.language,
        "line_count": cf.line_count,
        "file_size": cf.file_size,
        "role": cf.role,
        "is_entry_point": cf.is_entry_point,
        "is_config": cf.is_config,
        "is_test": cf.is_test,
        "imports": cf.imports or [],
        "exports": cf.exports or [],
        "functions": cf.functions or [],
        "classes": cf.classes or []
    }


@router.get("/content/{file_path:path}")
def get_file_content(project_id: str, file_path: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    norm_path = file_path.replace("\\", "/").strip("/")
    full_path = Path(project.root_path) / norm_path

    if not full_path.exists():
        # Search in subdirectories if archive had nested folder
        matches = list(Path(project.root_path).rglob(Path(norm_path).name))
        if matches:
            full_path = matches[0]

    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File content not found on disk")

    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {"content": content, "file_path": norm_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file content: {str(e)}")
