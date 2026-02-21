from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.api import deps
from app.schemas.chat import AIChatRequest, AIChatResponse, AIChatMessage
from app.models.user import User
from app.models.chat import AIChatMessage as AIChatMessageModel
from typing import List
import logging
from app.services.ai_service import ai_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Service is used via ai_service singleton

@router.post("/send", response_model=AIChatResponse)
async def send_chat_message(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Save user message
    user_msg = AIChatMessageModel(
        user_id=current_user.id,
        draft_id=request.draft_id,
        role="user",
        content=request.prompt
    )
    db.add(user_msg)
    db.commit() # Commit to get ID and ensure persistence
    
    # Construct conversation history
    # For MVP, we might just send the last few messages or just the current one contextually
    # ideally we fetch history from DB
    
    formatted_messages = [{
        "role": "user", 
        "content": [{"text": f"Platform: {request.platform}. Context: {request.prompt}"}]
    }]

    ai_text = await ai_service.chat(formatted_messages)

    # Save assistant response
    assistant_msg = AIChatMessageModel(
        user_id=current_user.id,
        draft_id=request.draft_id,
        role="assistant",
        content=ai_text
    )
    db.add(assistant_msg)
    db.commit()
    
    return {"response": ai_text, "draft_id": request.draft_id}

@router.get("/history/{draft_id}", response_model=List[AIChatMessage])
def get_chat_history(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    history = db.query(AIChatMessageModel).filter(
        AIChatMessageModel.user_id == current_user.id,
        AIChatMessageModel.draft_id == draft_id
    ).order_by(AIChatMessageModel.timestamp.asc()).all()
    return history
