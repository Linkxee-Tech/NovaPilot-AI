from sqlalchemy.orm import Session
from app.models.post import Post, Draft
from app.schemas.post import PostCreate, PostUpdate, DraftCreate, DraftUpdate
from typing import List

def get_post(db: Session, post_id: int, user_id: int | None = None):
    query = db.query(Post).filter(Post.id == post_id)
    if user_id is not None:
        query = query.filter(Post.user_id == user_id)
    return query.first()

def get_posts(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    query = db.query(Post)
    if user_id is not None:
        query = query.filter(Post.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_post(db: Session, post: PostCreate, user_id: int):
    db_post = Post(**post.model_dump(), user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


def update_post(db: Session, post_id: int, post_in: PostUpdate, user_id: int | None = None):
    db_post = get_post(db, post_id, user_id=user_id)
    if not db_post:
        return None
    update_data = post_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_post, field, update_data[field])
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def delete_post(db: Session, post_id: int, user_id: int | None = None):
    db_post = get_post(db, post_id, user_id=user_id)
    if db_post:
        db.delete(db_post)
        db.commit()
    return db_post

def get_drafts(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    query = db.query(Draft)
    if user_id is not None:
        query = query.filter(Draft.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def update_draft(db: Session, draft_id: int, draft_in: DraftUpdate, user_id: int | None = None):
    query = db.query(Draft).filter(Draft.id == draft_id)
    if user_id is not None:
        query = query.filter(Draft.user_id == user_id)
    db_draft = query.first()
    if not db_draft:
        return None
    update_data = draft_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_draft, field, update_data[field])
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)
    return db_draft

def delete_draft(db: Session, draft_id: int, user_id: int | None = None):
    query = db.query(Draft).filter(Draft.id == draft_id)
    if user_id is not None:
        query = query.filter(Draft.user_id == user_id)
    db_draft = query.first()
    if db_draft:
        db.delete(db_draft)
        db.commit()
    return db_draft


def create_draft(db: Session, draft: DraftCreate, user_id: int):
    db_draft = Draft(**draft.model_dump(), user_id=user_id)
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)
    return db_draft

