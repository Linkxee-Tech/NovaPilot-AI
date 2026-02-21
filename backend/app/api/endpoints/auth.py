from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import os
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.api import crud_user, deps
from app.core import security
from app.core.config import settings
from app.core.db import get_db
from app.models.user import User as UserModel
from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    Token,
    User,
    UserCreate,
)


router = APIRouter()

ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"


def _cookie_secure() -> bool:
    explicit = os.getenv("COOKIE_SECURE")
    if explicit is not None:
        return explicit.lower() in {"1", "true", "yes"}
    return os.getenv("ENV", "development").lower() == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    secure = _cookie_secure()
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")


def _build_auth_payload(user: UserModel, access_token: str, refresh_token: str) -> dict:
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user": user,
    }


def _create_password_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {"exp": expire, "sub": email, "type": "password_reset"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/login", response_model=Token)
def login_for_access_token(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(subject=user.email, expires_delta=access_token_expires)
    refresh_token = security.create_refresh_token(subject=user.email)
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    return _build_auth_payload(user, access_token, refresh_token)


@router.post("/register", response_model=User)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    return crud_user.create_user(db, user_in=user_in)


@router.get("/me", response_model=User)
def read_current_user(current_user: UserModel = Depends(deps.get_current_active_user)):
    return current_user


@router.post("/logout")
def logout(response: Response):
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/password-reset/request")
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_email(db, email=request.email)
    if not user:
        return {"message": "If an account exists with that email, a reset link has been sent."}

    reset_token = _create_password_reset_token(user.email)
    payload: dict[str, str] = {"message": "If an account exists with that email, a reset link has been sent."}
    if os.getenv("ENV", "development").lower() != "production":
        payload["reset_token"] = reset_token
    return payload


@router.post("/password-reset/confirm")
def confirm_password_reset(confirm: PasswordResetConfirm, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(confirm.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        email: str | None = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.hashed_password = security.get_password_hash(confirm.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/google/login")
def google_login():
    """
    Return Google OAuth2 authorization URL.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not google_client_id or not google_redirect_uri:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")

    params = urlencode(
        {
            "client_id": google_client_id,
            "redirect_uri": google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}


@router.get("/google/callback", response_model=Token)
def google_callback(code: str, response: Response, db: Session = Depends(get_db)):
    """
    Handle Google OAuth2 callback and issue local auth session.
    """
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not google_client_id or not google_client_secret or not google_redirect_uri:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")

    token_resp = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "redirect_uri": google_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=10.0,
    )
    if token_resp.status_code >= 400:
        raise HTTPException(status_code=400, detail="Failed to exchange Google auth code")

    google_access_token = token_resp.json().get("access_token")
    if not google_access_token:
        raise HTTPException(status_code=400, detail="Failed to obtain Google access token")

    userinfo_resp = httpx.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {google_access_token}"},
        timeout=10.0,
    )
    if userinfo_resp.status_code >= 400:
        raise HTTPException(status_code=400, detail="Failed to obtain Google user profile")

    userinfo = userinfo_resp.json()
    email = userinfo.get("email")
    google_id = userinfo.get("sub")
    full_name = userinfo.get("name")
    if not email or not google_id:
        raise HTTPException(status_code=400, detail="Incomplete Google profile data")

    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        user_in = UserCreate(
            email=email,
            full_name=full_name,
            google_id=google_id,
            password=secrets.token_urlsafe(24),
        )
        user = crud_user.create_user(db, user_in=user_in)
    else:
        user.google_id = user.google_id or google_id
        if full_name and not user.full_name:
            user.full_name = full_name
        db.commit()
        db.refresh(user)

    access_token = security.create_access_token(subject=user.email)
    refresh_token = security.create_refresh_token(subject=user.email)
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
    return _build_auth_payload(user, access_token, refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(
    request: Request,
    response: Response,
    refresh_token: str | None = Body(default=None, embed=True),
    db: Session = Depends(get_db),
):
    token = refresh_token or request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        email: str | None = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if not email:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token = security.create_access_token(subject=user.email)
    new_refresh_token = security.create_refresh_token(subject=user.email)
    _set_auth_cookies(response, access_token=access_token, refresh_token=new_refresh_token)
    return _build_auth_payload(user, access_token, new_refresh_token)
