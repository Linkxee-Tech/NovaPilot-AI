from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List

class AIChatMessageBase(BaseModel):
    content: str
    role: str
    draft_id: Optional[int] = None

class AIChatMessageCreate(AIChatMessageBase):
    pass

class AIChatMessage(AIChatMessageBase):
    id: int
    user_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class AIChatHistoryMessage(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    prompt: str
    draft_id: Optional[int] = None
    platform: Optional[str] = "LinkedIn"
    history: List[AIChatHistoryMessage] = Field(default_factory=list)

class AIChatResponse(BaseModel):
    response: str
    draft_id: Optional[int] = None
