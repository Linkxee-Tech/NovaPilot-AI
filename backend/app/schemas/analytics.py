from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, Any

class AnalyticsBase(BaseModel):
    impressions: int = 0
    clicks: int = 0
    shares: int = 0
    comments: int = 0
    engagement_rate: Optional[str] = None

class AnalyticsUpdate(BaseModel):
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    shares: Optional[int] = None
    comments: Optional[int] = None

class Analytics(AnalyticsBase):
    id: int
    post_id: int
    historical_data: Optional[Any] = None
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    trace_id: str
    action: str
    status: str
    platform: Optional[str] = None
    user: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditLogCreate(AuditLogBase):
    evidence_hash: Optional[str] = None
    details: Optional[Any] = None

class AuditLog(AuditLogBase):
    id: int
    evidence_hash: Optional[str] = None
    details: Optional[Any] = None
    
    model_config = ConfigDict(from_attributes=True)
