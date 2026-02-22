from fastapi import APIRouter, Depends
from sqlalchemy import desc
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
MAX_CONTEXT_MESSAGES = 12

# Service is used via ai_service singleton

@router.post("/send", response_model=AIChatResponse)
async def send_chat_message(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    sanitized_prompt = NovaTextService._sanitize_text(request.prompt, allow_newlines=True)
    if not sanitized_prompt:
        return {"response": "Please provide more details about the post you want to generate.", "draft_id": request.draft_id}

    def _normalize_role(role: str) -> str:
        return "assistant" if str(role).lower() == "assistant" else "user"

    history_context: list[dict[str, str]] = []

    for message in request.history[-MAX_CONTEXT_MESSAGES:]:
        content = NovaTextService._sanitize_text(message.content, allow_newlines=True)
        if content:
            history_context.append(
                {
                    "role": _normalize_role(message.role),
                    "content": content,
                }
            )

    # If no explicit history was sent, fallback to persisted chat turns for this draft.
    if not history_context and request.draft_id is not None:
        persisted = (
            db.query(AIChatMessageModel)
            .filter(
                AIChatMessageModel.user_id == current_user.id,
                AIChatMessageModel.draft_id == request.draft_id,
            )
            .order_by(desc(AIChatMessageModel.timestamp), desc(AIChatMessageModel.id))
            .limit(MAX_CONTEXT_MESSAGES)
            .all()
        )
        for message in reversed(persisted):
            content = NovaTextService._sanitize_text(message.content, allow_newlines=True)
            if content:
                history_context.append(
                    {
                        "role": _normalize_role(message.role),
                        "content": content,
                    }
                )

    # Save user message
    user_msg = AIChatMessageModel(
        user_id=current_user.id,
        draft_id=request.draft_id,
        role="user",
        content=sanitized_prompt
    )
    db.add(user_msg)
    db.commit() # Commit to get ID and ensure persistence

    # Ensure current prompt participates in context (unless it already exists as latest user turn).
    if not history_context or history_context[-1]["content"] != sanitized_prompt:
        history_context.append({"role": "user", "content": sanitized_prompt})

    # Keep context concise.
    history_context = history_context[-MAX_CONTEXT_MESSAGES:]
    context_block = "\n".join(
        [
            f"{'User' if item['role'] == 'user' else 'Assistant'}: {item['content']}"
            for item in history_context[:-1]
        ]
    ).strip()

    ai_text = ""
    try:
        optimization_prompt = sanitized_prompt
        if context_block:
            optimization_prompt = (
                f"{sanitized_prompt}\n\n"
                f"Conversation context:\n{context_block}\n\n"
                "Use the context above for continuity and include the user's newest details."
            )

        optimized = await ai_service.optimize_content(
            optimization_prompt,
            tone="professional",
            audience=f"{request.platform} audience",
        )
        caption = NovaTextService._sanitize_caption(optimized.get("optimized_caption", ""))
        ai_text = caption
    except Exception as optimize_exc:
        logger.warning("Structured caption generation failed, falling back to chat: %s", optimize_exc)

        chat_prompt = (
            "Write one ready-to-post social media caption in plain text only. "
            "No markdown, no bullets, no placeholders, no explanations. "
            f"Platform: {request.platform}. "
            f"Latest user request: {sanitized_prompt}"
        )
        if context_block:
            chat_prompt = f"{chat_prompt}\n\nPrior conversation:\n{context_block}"

        formatted_messages = [
            {
                "role": "user",
                "content": [{"text": chat_prompt}],
            }
        ]

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
