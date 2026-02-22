from fastapi.testclient import TestClient

from app.api import deps
from app.core.db import SessionLocal
from app.main import app
from app.models.chat import AIChatMessage
from app.models.post import Draft
from app.models.user import User
from app.services.ai_service import ai_service


client = TestClient(app)


def _cleanup_user_data(db, user_id: int) -> None:
    db.query(AIChatMessage).filter(AIChatMessage.user_id == user_id).delete()
    db.query(Draft).filter(Draft.user_id == user_id).delete()
    db.query(User).filter(User.id == user_id).delete()
    db.commit()


def test_chat_send_uses_request_history(monkeypatch):
    db = SessionLocal()
    user = User(
        id=901,
        email="chat-history-request@example.com",
        hashed_password="x",
        full_name="Chat Request History",
        is_active=True,
    )
    db.add(user)
    db.commit()

    app.dependency_overrides[deps.get_current_active_user] = lambda: user

    captured: dict[str, str] = {}

    async def fake_optimize(content: str, tone: str, audience: str):
        captured["content"] = content
        return {"optimized_caption": "Refined post from history"}

    monkeypatch.setattr(ai_service, "optimize_content", fake_optimize)

    response = client.post(
        "/api/v1/chat/send",
        json={
            "prompt": "Add a stronger call-to-action at the end.",
            "platform": "linkedin",
            "history": [
                {"role": "user", "content": "I launched a new workflow automation tool."},
                {"role": "assistant", "content": "Great start. Mention measurable outcomes."},
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["response"] == "Refined post from history"
    assert "Conversation context:" in captured["content"]
    assert "I launched a new workflow automation tool." in captured["content"]
    assert "Mention measurable outcomes." in captured["content"]

    app.dependency_overrides.clear()
    _cleanup_user_data(db, user.id)
    db.close()


def test_chat_send_uses_persisted_history_when_history_not_provided(monkeypatch):
    db = SessionLocal()
    user = User(
        id=902,
        email="chat-history-db@example.com",
        hashed_password="x",
        full_name="Chat DB History",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    draft = Draft(user_id=user.id, content="Draft baseline content")
    db.add(draft)
    db.commit()
    db.refresh(draft)

    db.add(
        AIChatMessage(
            user_id=user.id,
            draft_id=draft.id,
            role="user",
            content="We announced our product launch yesterday.",
        )
    )
    db.add(
        AIChatMessage(
            user_id=user.id,
            draft_id=draft.id,
            role="assistant",
            content="Include customer impact and one KPI.",
        )
    )
    db.commit()

    app.dependency_overrides[deps.get_current_active_user] = lambda: user

    captured: dict[str, str] = {}

    async def fake_optimize(content: str, tone: str, audience: str):
        captured["content"] = content
        return {"optimized_caption": "Refined post from db history"}

    monkeypatch.setattr(ai_service, "optimize_content", fake_optimize)

    response = client.post(
        "/api/v1/chat/send",
        json={
            "draft_id": draft.id,
            "prompt": "Add metrics and a closing question.",
            "platform": "linkedin",
        },
    )

    assert response.status_code == 200
    assert response.json()["response"] == "Refined post from db history"
    assert "Conversation context:" in captured["content"]
    assert "We announced our product launch yesterday." in captured["content"]
    assert "Include customer impact and one KPI." in captured["content"]

    app.dependency_overrides.clear()
    _cleanup_user_data(db, user.id)
    db.close()
