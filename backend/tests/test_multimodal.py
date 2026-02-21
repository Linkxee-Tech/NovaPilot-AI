import os
import tempfile

import pytest
from fastapi.testclient import TestClient

from app.api import deps
from app.main import app
from app.services.ai_service import ai_service


client = TestClient(app)


class DummyUser:
    id = 1
    is_active = True


def override_active_user():
    return DummyUser()


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_upload_media_returns_metadata():
    app.dependency_overrides[deps.get_current_active_user] = override_active_user

    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    try:
        tmp_file.write(b"\xff\xd8\xff\xe0" + b"mockjpegcontent")
        tmp_file.close()

        with open(tmp_file.name, "rb") as handle:
            response = client.post(
                "/api/v1/posts/upload",
                files={"file": ("sample.jpg", handle, "image/jpeg")},
            )

        assert response.status_code == 200
        payload = response.json()
        assert payload["media_url"].startswith("/uploads/posts/")
        assert payload["metadata"]["media_type"] == "image"
        assert payload["metadata"]["extension"] == ".jpg"
        assert payload["metadata"]["size_bytes"] > 0
    finally:
        if os.path.exists(tmp_file.name):
            os.remove(tmp_file.name)

        media_url = response.json().get("media_url") if "response" in locals() and response.status_code == 200 else None
        if media_url:
            saved_path = os.path.join("uploads", "posts", os.path.basename(media_url))
            if os.path.exists(saved_path):
                os.remove(saved_path)


def test_multimodal_optimize_endpoint(monkeypatch):
    app.dependency_overrides[deps.get_current_active_user] = override_active_user

    async def fake_optimize(content: str, tone: str, audience: str, media_context: dict):
        return {
            "optimized_caption": "Refined caption",
            "hashtags": ["#AI", "#Automation"],
            "engagement_tips": ["Use a strong opening line"],
            "media_insights": {
                "media_type": media_context.get("media_type", "image"),
                "summary": "Image reinforces key message",
                "suggested_alt_text": "Team discussing automation strategy",
                "content_hooks": ["Lead with the key visual"],
            },
        }

    monkeypatch.setattr(ai_service, "optimize_multimodal_content", fake_optimize)

    response = client.post(
        "/api/v1/posts/optimize/multimodal",
        json={
            "caption": "Launch update for NovaPilot",
            "tone": "professional",
            "target_audience": "product teams",
            "media_context": {
                "media_type": "image",
                "filename": "dashboard.jpg",
                "size_bytes": 1024,
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["optimized_caption"] == "Refined caption"
    assert payload["media_insights"]["media_type"] == "image"
    assert len(payload["hashtags"]) == 2
