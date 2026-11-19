from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from server.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    # Dummy DB session injection placeholder
    service = AuthService(None)
    if payload.email == "demo@example.com" and payload.password == "secret123":
        return {
            "token": "jwt-sample-token-abc123xyz",
            "user": {
                "id": "usr-1",
                "email": payload.email,
                "name": "Demo Engineer"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")
