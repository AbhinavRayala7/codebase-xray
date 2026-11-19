import os
import shutil
import zipfile
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import Project, AnalysisJob, CodeFile, Dependency, CodeIssue
from app.analyzer.parsers import registry
from app.analyzer.parsers.base import ParsedFileResult
from app.analyzer.dependency_graph import DependencyEngine
from app.analyzer.health_checker import HealthChecker

logger = logging.getLogger("codebase_xray.engine")
logging.basicConfig(level=logging.INFO)


class RepositoryEngine:
    def __init__(self, db: Session, project: Project, job: AnalysisJob):
        self.db = db
        self.project = project
        self.job = job

    def update_job(self, stage: str, progress: int, message: str):
        self.job.stage = stage
        self.job.progress_percent = progress
        logs = list(self.job.log_messages or [])
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        logs.append(f"[{timestamp}] [{stage.upper()}] {message}")
        self.job.log_messages = logs
        self.db.commit()
        logger.info(f"Project {self.project.id} - {stage} ({progress}%): {message}")

    def safe_extract_zip(self, zip_path: Path, dest_dir: Path) -> List[Path]:
        """Safely extracts a ZIP archive, guarding against Zip Slip and limits."""
        extracted_files = []
        dest_dir.mkdir(parents=True, exist_ok=True)
        resolved_dest = dest_dir.resolve()

        with zipfile.ZipFile(zip_path, 'r') as archive:
            file_list = archive.infolist()
            if len(file_list) > settings.MAX_FILE_COUNT:
                raise ValueError(f"Repository exceeds maximum file count limit ({settings.MAX_FILE_COUNT} files).")

            for member in file_list:
                # Path traversal check
                target_path = (dest_dir / member.filename).resolve()
                if not str(target_path).startswith(str(resolved_dest)):
                    raise ValueError(f"Security Alert: Malicious ZIP path traversal detected in {member.filename}")

                if member.is_dir():
                    continue

                # Check if ignored directory
                path_parts = Path(member.filename).parts
                if any(part in settings.IGNORED_DIRS for part in path_parts):
                    continue

                archive.extract(member, dest_dir)
                extracted_files.append(target_path)

        return extracted_files

    def fetch_github_repo(self, github_url: str, dest_dir: Path) -> Path:
        """Downloads a public GitHub repository archive safely."""
        clean_url = github_url.strip().rstrip("/")
        if clean_url.endswith(".git"):
            clean_url = clean_url[:-4]

        # Expected format: https://github.com/owner/repo
        parts = clean_url.split("/")
        if len(parts) < 5 or "github.com" not in parts[2]:
            raise ValueError("Invalid GitHub repository URL. Must be in the format https://github.com/owner/repo")

        owner = parts[3]
        repo_name = parts[4]
        
        # Download repository archive via GitHub codeload tarball/zip
        zip_url = f"https://api.github.com/repos/{owner}/{repo_name}/zipball/HEAD"
        headers = {"User-Agent": "Codebase-X-Ray/1.0"}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

        zip_dest = dest_dir.parent / f"{self.project.id}_download.zip"
        with httpx.Client(follow_redirects=True, timeout=60.0) as client:
            resp = client.get(zip_url, headers=headers)
            if resp.status_code == 404:
                # Try master branch directly
                zip_url_master = f"https://github.com/{owner}/{repo_name}/archive/refs/heads/master.zip"
                resp = client.get(zip_url_master, headers=headers)

            if resp.status_code != 200:
                raise ValueError(f"Failed to fetch GitHub repository (HTTP {resp.status_code}): Check if repository is public.")

            with open(zip_dest, "wb") as f:
                f.write(resp.content)

        return zip_dest

    def scan_directory(self, root_dir: Path) -> List[Path]:
        """Scans directory for supported source files, skipping ignored folders."""
        found_files = []
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to avoid traversing ignored directories
            dirs[:] = [d for d in dirs if d not in settings.IGNORED_DIRS]

            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                    found_files.append(file_path)

        return found_files

    def detect_languages_and_frameworks(self, root_dir: Path, files: List[ParsedFileResult]) -> Dict[str, Any]:
        """Detects language breakdown and project frameworks from files and manifests."""
        lang_counts: Dict[str, int] = {}
        for f in files:
            lang_counts[f.language] = lang_counts.get(f.language, 0) + 1

        total = sum(lang_counts.values()) or 1
        lang_percentages = {lang: round((count / total) * 100, 1) for lang, count in lang_counts.items()}
        primary_lang = max(lang_counts.items(), key=lambda x: x[1])[0] if lang_counts else "Unknown"

        frameworks = set()

        # Check package.json
        package_json = root_dir / "package.json"
        if package_json.exists():
            try:
                with open(package_json, "r", encoding="utf-8") as pf:
                    pkg_data = json.load(pf)
                    all_deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                    for key in all_deps:
                        if "react" in key:
                            frameworks.add("React")
                        if "next" in key:
                            frameworks.add("Next.js")
                        if "vue" in key:
                            frameworks.add("Vue")
                        if "express" in key:
                            frameworks.add("Express")
                        if "tailwind" in key:
                            frameworks.add("TailwindCSS")
                        if "vite" in key:
                            frameworks.add("Vite")
                        if "typescript" in key:
                            frameworks.add("TypeScript")
            except Exception:
                pass

        # Check requirements.txt or pyproject.toml
        req_file = root_dir / "requirements.txt"
        if req_file.exists():
            try:
                with open(req_file, "r", encoding="utf-8") as rf:
                    content = rf.read().lower()
                    if "fastapi" in content:
                        frameworks.add("FastAPI")
                    if "flask" in content:
                        frameworks.add("Flask")
                    if "django" in content:
                        frameworks.add("Django")
                    if "sqlalchemy" in content:
                        frameworks.add("SQLAlchemy")
                    if "pydantic" in content:
                        frameworks.add("Pydantic")
            except Exception:
                pass

        # Add framework signals detected by AST parsers
        for f in files:
            for sig in f.framework_signals:
                frameworks.add(sig.title())

        return {
            "languages": lang_percentages,
            "primary_language": primary_lang,
            "frameworks": list(frameworks)
        }

    def execute_analysis(self, source_path: Path):
        """Main pipeline executing full repository analysis."""
        try:
            self.update_job("extracting", 10, "Extracting and verifying repository structure...")
            dest_dir = Path(self.project.root_path)

            if self.project.source_type == "zip":
                self.safe_extract_zip(source_path, dest_dir)
            elif self.project.source_type == "github":
                zip_dest = self.fetch_github_repo(self.project.repository_url, dest_dir)
                self.safe_extract_zip(zip_dest, dest_dir)
                try:
                    zip_dest.unlink()
                except Exception:
                    pass
            elif self.project.source_type == "sample":
                # Sample repo files are already present in dest_dir
                pass

            # Handle single top-level folder inside zip (common in GitHub tarballs)
            subdirs = [d for d in dest_dir.iterdir() if d.is_dir() and d.name not in settings.IGNORED_DIRS]
            actual_root = dest_dir
            if len(subdirs) == 1 and not any(f.is_file() for f in dest_dir.iterdir()):
                actual_root = subdirs[0]

            self.update_job("scanning", 25, "Scanning source files and directory tree...")
            raw_files = self.scan_directory(actual_root)
            if not raw_files:
                raise ValueError("No supported source code files discovered in the repository.")

            self.update_job("parsing", 45, f"Parsing {len(raw_files)} files across languages...")
            parsed_results: List[ParsedFileResult] = []
            total_lines = 0

            for fpath in raw_files:
                rel_path = str(fpath.relative_to(actual_root)).replace("\\", "/")
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    parsed = registry.parse(fpath, rel_path, content)
                    parsed_results.append(parsed)
                    total_lines += parsed.line_count
                except Exception as e:
                    logger.warning(f"Error parsing {rel_path}: {e}")

            self.update_job("building_graph", 70, "Constructing dependency graph and resolving imports...")
            dep_engine = DependencyEngine(parsed_results)

            meta = self.detect_languages_and_frameworks(actual_root, parsed_results)
            self.project.total_files = len(parsed_results)
            self.project.total_lines = total_lines
            self.project.primary_language = meta["primary_language"]
            self.project.languages = meta["languages"]
            self.project.frameworks = meta["frameworks"]

            self.update_job("checking_health", 85, "Evaluating codebase health and detecting anti-patterns...")
            health_checker = HealthChecker(parsed_results, dep_engine)
            health_report = health_checker.run_checks()
            self.project.health_score = health_report.health_score

            # Persist to database
            self.update_job("persisting", 92, "Saving analyzed metadata and relationships to database...")
            
            # Map for linking dependencies
            db_file_map: Dict[str, CodeFile] = {}

            for pres in parsed_results:
                cf = CodeFile(
                    project_id=self.project.id,
                    relative_path=pres.relative_path,
                    file_name=pres.file_name,
                    extension=pres.extension,
                    language=pres.language,
                    file_size=pres.file_size,
                    line_count=pres.line_count,
                    is_entry_point=pres.is_entry_point,
                    is_config=pres.is_config,
                    is_test=pres.is_test,
                    role=pres.role,
                    imports=[i.model_dump() for i in pres.imports],
                    exports=[e.model_dump() for e in pres.exports],
                    functions=[fn.model_dump() for fn in pres.functions],
                    classes=[c.model_dump() for c in pres.classes],
                )
                self.db.add(cf)
                db_file_map[pres.relative_path.replace("\\", "/")] = cf

            self.db.flush()

            # Persist dependencies
            cycles = dep_engine.get_circular_dependencies()
            cycle_nodes = {node for cycle in cycles for node in cycle}

            for pres in parsed_results:
                src_cf = db_file_map.get(pres.relative_path.replace("\\", "/"))
                if not src_cf:
                    continue

                for imp in pres.imports:
                    target_rel = dep_engine._resolve_target(pres.relative_path, imp.source)
                    target_cf = db_file_map.get(target_rel) if target_rel else None
                    is_circ = bool(target_rel and (src_cf.relative_path in cycle_nodes) and (target_rel in cycle_nodes))

                    dep = Dependency(
                        project_id=self.project.id,
                        source_file_id=src_cf.id,
                        target_file_id=target_cf.id if target_cf else None,
                        imported_name=imp.source,
                        symbols=imp.imported_symbols,
                        is_external=imp.is_external or (target_cf is None),
                        is_circular=is_circ
                    )
                    self.db.add(dep)

            # Persist health issues
            for issue in health_report.issues:
                ci = CodeIssue(
                    project_id=self.project.id,
                    file_path=issue["file_path"],
                    category=issue["category"],
                    severity=issue["severity"],
                    title=issue["title"],
                    description=issue["description"],
                    line_number=issue.get("line_number"),
                    suggestion=issue.get("suggestion"),
                    is_confirmed=issue.get("is_confirmed", True)
                )
                self.db.add(ci)

            self.project.status = "completed"
            self.job.status = "completed"
            self.job.completed_at = datetime.utcnow()
            self.update_job("completed", 100, f"Analysis completed successfully! Analyzed {len(parsed_results)} files.")

        except Exception as e:
            logger.error(f"Analysis failed for project {self.project.id}: {e}", exc_info=True)
            self.project.status = "failed"
            self.project.error_message = str(e)
            self.job.status = "failed"
            self.update_job("failed", 100, f"Analysis error: {str(e)}")
            self.db.commit()
