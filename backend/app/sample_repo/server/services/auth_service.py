import hashlib
import uuid
from typing import Optional
from server.models.database import User
from server.utils.logger import get_logger

logger = get_logger("auth_service")


class AuthService:
    def __init__(self, db_session):
        self.db = db_session

    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        logger.info(f"Authenticating user attempt for {email}")
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if user.hashed_password != self.hash_password(password):
            return None
        return user

    def create_user(self, email: str, password: str, name: str) -> User:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=self.hash_password(password),
            name=name
        )
        self.db.add(user)
        self.db.commit()
        return user
