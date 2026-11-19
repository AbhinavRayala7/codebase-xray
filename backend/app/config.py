import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

# On Vercel / serverless platforms, only /tmp is writable
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    STORAGE_DIR = Path("/tmp/storage")
    UPLOAD_DIR = Path("/tmp/storage/uploads")
    REPOS_DIR = Path("/tmp/storage/repos")
else:
    STORAGE_DIR = BASE_DIR / "storage"
    UPLOAD_DIR = STORAGE_DIR / "uploads"
    REPOS_DIR = STORAGE_DIR / "repos"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
REPOS_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    PROJECT_NAME: str = "Codebase X-Ray"
    TAGLINE: str = "See Beyond the Code."
    CREATOR: str = "Made with ♥ by Abhi"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{STORAGE_DIR}/codebase_xray.db")
    
    # AI Credentials (kept on backend)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # GitHub Integration
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    
    # Security & Limits
    MAX_ZIP_SIZE_MB: int = int(os.getenv("MAX_ZIP_SIZE_MB", "50"))
    MAX_FILE_COUNT: int = int(os.getenv("MAX_FILE_COUNT", "2500"))
    ALLOWED_EXTENSIONS: set = {
        ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
        ".java", ".json", ".yaml", ".yml", ".md", ".html", ".css",
        ".sql", ".env.example", ".toml", ".xml", ".properties", ".gradle"
    }
    IGNORED_DIRS: set = {
        "node_modules", ".git", ".next", "dist", "build", "out",
        "__pycache__", ".pytest_cache", ".venv", "venv", "env",
        ".idea", ".vscode", "target", "bin", "obj", ".turbo",
        ".husky", "coverage", ".docusaurus"
    }


settings = Settings()
