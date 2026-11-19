import pytest
from server.services.auth_service import AuthService


def test_password_hashing():
    service = AuthService(None)
    hashed = service.hash_password("mypassword123")
    assert hashed != "mypassword123"
    assert len(hashed) == 64  # SHA-256 length
