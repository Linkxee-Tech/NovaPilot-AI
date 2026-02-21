from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class PlatformBase(BaseModel):
    name: str
    username: str

class PlatformCreate(PlatformBase):
    password: str

class PlatformUpdate(BaseModel):
    password: Optional[str] = None
    cookies: Optional[str] = None
    is_active: Optional[bool] = None

class PlatformInDBBase(PlatformBase):
    id: int
    is_active: bool
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Platform(PlatformInDBBase):
    pass
