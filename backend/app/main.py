from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import engine, Base
from app.api.routes_projects import router as projects_router
from app.api.routes_analysis import router as analysis_router
from app.api.routes_tracer import router as tracer_router
from app.api.routes_investigator import router as investigator_router
from app.api.routes_files import router as files_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="See Beyond the Code. AI-powered software intelligence platform.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(projects_router)
app.include_router(analysis_router)
app.include_router(tracer_router)
app.include_router(investigator_router)
app.include_router(files_router)


@app.get("/")
def root():
    return {
        "tool": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "credit": settings.CREATOR,
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
