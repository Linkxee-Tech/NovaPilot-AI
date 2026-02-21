import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_service import ai_service
from app.services.planning.planner_service import PlannerService


client = TestClient(app)


def test_plan_endpoint_returns_structured_plan(monkeypatch):
    async def fake_generate_plan(goal: str, context: dict | None = None, max_steps: int = 5):
        return {
            "summary": "Test plan summary",
            "source": "nova",
            "tasks": [
                {
                    "id": 1,
                    "title": "Generate draft",
                    "goal": "Generate a first draft",
                    "action_type": "generate_content",
                    "context": context or {},
                    "requires_human_approval": False,
                },
                {
                    "id": 2,
                    "title": "Schedule post",
                    "goal": "Schedule post",
                    "action_type": "schedule_post",
                    "context": context or {},
                    "requires_human_approval": True,
                },
            ],
        }

    monkeypatch.setattr(ai_service, "generate_plan", fake_generate_plan)

    response = client.post(
        "/api/v1/automation/plan",
        json={
            "goal": "Create and schedule a LinkedIn post",
            "context": {"platform": "linkedin"},
            "max_steps": 5,
            "execute": False,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["goal"] == "Create and schedule a LinkedIn post"
    assert payload["source"] == "nova"
    assert len(payload["tasks"]) == 2
    assert payload["tasks"][0]["title"] == "Generate draft"
    assert payload["trace_id"] is not None


@pytest.mark.asyncio
async def test_planner_service_falls_back_without_model():
    class FailingTextService:
        async def chat(self, messages):
            raise RuntimeError("No model available")

    planner = PlannerService(FailingTextService())
    plan = await planner.generate_plan(
        "Generate and schedule a post, then monitor engagement",
        {"platform": "linkedin"},
        max_steps=5,
    )

    assert plan["source"] == "fallback"
    assert len(plan["tasks"]) >= 2
    assert any(step["action_type"] == "schedule_post" for step in plan["tasks"])
