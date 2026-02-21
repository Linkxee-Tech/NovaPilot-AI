from sqlalchemy.orm import Session
from app.models.account import SocialAccount
from app.schemas.auth import User  # or current_user
from app.core.encryption import encrypt_data, decrypt_data
from app.models.post import Platform
import json

def create_social_account(db: Session, user_id: int, platform: Platform, username: str, credentials: dict):
    encrypted_creds = encrypt_data(json.dumps(credentials))
    db_account = SocialAccount(
        user_id=user_id,
        platform=platform,
        username=username,
        encrypted_credentials=encrypted_creds,
        status="active"
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_social_accounts(db: Session, user_id: int):
    return db.query(SocialAccount).filter(SocialAccount.user_id == user_id).all()

def get_social_account(db: Session, account_id: int, user_id: int):
    return db.query(SocialAccount).filter(SocialAccount.id == account_id, SocialAccount.user_id == user_id).first()

def delete_social_account(db: Session, account_id: int, user_id: int):
    db_account = get_social_account(db, account_id, user_id)
    if db_account:
        db.delete(db_account)
        db.commit()
    return db_account
