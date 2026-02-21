from pydantic import BaseModel, ConfigDict
from app.models.post import Platform
from typing import Optional, Dict

class SocialAccountBase(BaseModel):
    platform: Platform
    username: str

class SocialAccountCreate(SocialAccountBase):
    credentials: Dict[str, str]

class SocialAccount(SocialAccountBase):
    id: int
    user_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)
