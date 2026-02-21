from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.api import crud_account, deps
from app.core.db import get_db
from app.schemas.account import SocialAccount, SocialAccountCreate
from app.schemas.auth import User, UserProfileUpdate
from app.models.user import User as UserModel
from app.core.storage import storage_service
from typing import List
import os
import shutil
import uuid

router = APIRouter()

@router.patch("/profile", response_model=User)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Update the current user's profile information.
    """
    if profile_in.email is not None:
        existing_user = db.query(UserModel).filter(UserModel.email == profile_in.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_in.email
    
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Upload and update the user's avatar to S3.
    """
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"avatars/{current_user.id}_{uuid.uuid4()}{file_ext}"
    
    # Simple temporary local save before S3 upload
    temp_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Upload to S3
    avatar_url = await storage_service.upload_file(temp_path, file_name)
    
    # Update user record
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    # Clean up temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    return {"avatar_url": avatar_url}

@router.post("/", response_model=SocialAccount)
def connect_account(
    account_in: SocialAccountCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    # In a real scenario, validate connection with platform here
    return crud_account.create_social_account(
        db, 
        user_id=current_user.id, 
        platform=account_in.platform, 
        username=account_in.username, 
        credentials=account_in.credentials
    )

@router.get("/", response_model=List[SocialAccount])
def list_accounts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    return crud_account.get_social_accounts(db, user_id=current_user.id)

@router.delete("/{account_id}")
def disconnect_account(
    account_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    account = crud_account.delete_social_account(db, account_id=account_id, user_id=current_user.id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"status": "success"}

@router.get("/{account_id}/check")
def check_status(
    account_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    account = crud_account.get_social_account(db, account_id=account_id, user_id=current_user.id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    # Simulate status check
    return {"status": account.status, "validated_at": "2026-02-17 10:00:00"}
