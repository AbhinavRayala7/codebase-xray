from fastapi import FastAPI
from server.api.routes_auth import router as auth_router
from server.api.routes_tasks import router as tasks_router

app = FastAPI(title="TaskFlow Backend API", version="1.0.0")

app.include_router(auth_router)
app.include_router(tasks_router)


@app.get("/")
def root():
    return {"status": "ok", "service": "TaskFlow Backend"}
