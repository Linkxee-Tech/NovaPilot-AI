from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import crud_platform, deps
from app.core.db import get_db
from app.schemas.platform import Platform, PlatformCreate, PlatformUpdate
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Platform])
def read_platforms(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    platforms = crud_platform.get_platforms_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return platforms

@router.post("/", response_model=Platform)
def create_platform_endpoint(
    platform: PlatformCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return crud_platform.create_platform(db=db, platform=platform, owner_id=current_user.id)

@router.delete("/{platform_id}", response_model=Platform)
def delete_platform_endpoint(
    platform_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    platform = crud_platform.get_platform(db, platform_id=platform_id)
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    if platform.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return crud_platform.delete_platform(db, platform_id=platform_id)
