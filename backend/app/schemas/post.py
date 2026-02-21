from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.post import PostStatus, Platform

class PostBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    platform: Platform
    scheduled_at: Optional[datetime] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    status: Optional[PostStatus] = None
    scheduled_at: Optional[datetime] = None

class Post(PostBase):
    id: int
    status: PostStatus
    published_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DraftBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    platform: Optional[Platform] = None

class DraftCreate(DraftBase):
    pass

class DraftUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    platform: Optional[Platform] = None

class Draft(DraftBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
