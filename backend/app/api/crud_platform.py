from sqlalchemy.orm import Session
from app.models.platform import Platform
from app.schemas.platform import PlatformCreate, PlatformUpdate
from typing import List, Optional

def get_platform(db: Session, platform_id: int) -> Optional[Platform]:
    return db.query(Platform).filter(Platform.id == platform_id).first()

def get_platforms_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[Platform]:
    return db.query(Platform).filter(Platform.owner_id == owner_id).offset(skip).limit(limit).all()

from app.core.config import settings
from cryptography.fernet import Fernet

def _get_fernet():
    return Fernet(settings.ENCRYPTION_KEY.encode())

def create_platform(db: Session, platform: PlatformCreate, owner_id: int) -> Platform:
    # Use real AES-256 (Fernet) encryption for credentials
    f = _get_fernet()
    encrypted_password = f.encrypt(platform.password.encode()).decode()
    
    db_obj = Platform(
        name=platform.name,
        username=platform.username,
        encrypted_password=encrypted_password,
        owner_id=owner_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_platform(db: Session, platform_id: int, platform_in: PlatformUpdate) -> Optional[Platform]:
    db_obj = get_platform(db, platform_id)
    if not db_obj:
        return None
    
    update_data = platform_in.dict(exclude_unset=True)
    if "password" in update_data:
        f = _get_fernet()
        update_data["encrypted_password"] = f.encrypt(update_data.pop("password").encode()).decode()
        
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_platform(db: Session, platform_id: int) -> Optional[Platform]:
    db_obj = get_platform(db, platform_id)
    if not db_obj:
        return None
    
    db.delete(db_obj)
    db.commit()
    return db_obj
