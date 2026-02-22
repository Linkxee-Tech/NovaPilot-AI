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
from app.services.nova.nova_text_service import NovaTextService

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
    
    ai_text = ""
    try:
        optimized = await ai_service.optimize_content(
            request.prompt,
            tone="professional",
            audience=f"{request.platform} audience",
        )
        caption = NovaTextService._sanitize_caption(optimized.get("optimized_caption", ""))
        ai_text = caption
    except Exception as optimize_exc:
        logger.warning("Structured caption generation failed, falling back to chat: %s", optimize_exc)

        formatted_messages = [{
            "role": "user",
            "content": [{
                "text": (
                    "Write one ready-to-post social media caption in plain text only. "
                    "No markdown, no bullets, no placeholders, no explanations. "
                    f"Platform: {request.platform}. User prompt: {request.prompt}"
                )
            }]
        }]

        ai_text = await ai_service.chat(formatted_messages)
        ai_text = NovaTextService._sanitize_caption(ai_text)

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
