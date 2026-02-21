import pytest
from app.core import security
from datetime import timedelta

def test_password_hashing():
    password = "secret_password"
    hashed = security.get_password_hash(password)
    assert security.verify_password(password, hashed)
    assert not security.verify_password("wrong_password", hashed)

def test_jwt_creation():
    subject = "test@example.com"
    token = security.create_access_token(subject)
    assert token is not None
    
    token_with_expiry = security.create_access_token(subject, expires_delta=timedelta(minutes=5))
    assert token_with_expiry is not None
