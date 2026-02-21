import json
import logging
from typing import Any, Dict, List


logger = logging.getLogger(__name__)


class PlannerService:
    """
    Generates multi-step plans from high-level goals.
    Falls back to deterministic planning when model calls fail.
    """

    def __init__(self, text_service: Any):
        self.text_service = text_service

    @staticmethod
    def _strip_code_fences(payload: str) -> str:
        text = payload.strip()
        if "```json" in text:
            return text.split("```json", 1)[1].split("```", 1)[0].strip()
        if "```" in text:
            return text.split("```", 1)[1].split("```", 1)[0].strip()
        return text

    @staticmethod
    def _normalize_tasks(tasks: List[Dict[str, Any]], max_steps: int) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for idx, raw in enumerate(tasks[:max_steps], start=1):
            normalized.append(
                {
                    "id": idx,
                    "title": str(raw.get("title") or f"Step {idx}"),
                    "goal": str(raw.get("goal") or raw.get("title") or "Execute automation step"),
                    "action_type": str(raw.get("action_type") or "run_automation"),
                    "context": raw.get("context") if isinstance(raw.get("context"), dict) else {},
                    "requires_human_approval": bool(raw.get("requires_human_approval", False)),
                }
            )
        return normalized

    @staticmethod
    def _fallback_plan(goal: str, context: Dict[str, Any], max_steps: int) -> Dict[str, Any]:
        goal_lower = goal.lower()
        tasks: List[Dict[str, Any]] = [
            {
                "id": 1,
                "title": "Generate draft content",
                "goal": "Generate a first draft aligned to the requested goal",
                "action_type": "generate_content",
                "context": context,
                "requires_human_approval": False,
            }
        ]

        if any(token in goal_lower for token in ["optimize", "improve", "rewrite", "refine"]):
            tasks.append(
                {
                    "id": len(tasks) + 1,
                    "title": "Optimize message",
                    "goal": "Optimize the draft for tone, clarity, and engagement",
                    "action_type": "optimize_content",
                    "context": context,
                    "requires_human_approval": False,
                }
            )

        if any(token in goal_lower for token in ["schedule", "tomorrow", "time", "calendar"]):
            tasks.append(
                {
                    "id": len(tasks) + 1,
                    "title": "Schedule post",
                    "goal": "Schedule the post at the best available time",
                    "action_type": "schedule_post",
                    "context": context,
                    "requires_human_approval": True,
                }
            )

        if any(token in goal_lower for token in ["publish", "launch", "post now"]):
            tasks.append(
                {
                    "id": len(tasks) + 1,
                    "title": "Publish post",
                    "goal": "Publish the prepared post through automation",
                    "action_type": "publish_post",
                    "context": context,
                    "requires_human_approval": True,
                }
            )

        if any(token in goal_lower for token in ["monitor", "analytics", "engagement", "comments"]):
            tasks.append(
                {
                    "id": len(tasks) + 1,
                    "title": "Monitor engagement",
                    "goal": "Collect and summarize engagement after publishing",
                    "action_type": "monitor_engagement",
                    "context": context,
                    "requires_human_approval": False,
                }
            )

        if len(tasks) == 1:
            tasks.append(
                {
                    "id": 2,
                    "title": "Execute automation",
                    "goal": goal,
                    "action_type": "run_automation",
                    "context": context,
                    "requires_human_approval": True,
                }
            )

        return {
            "summary": "Generated fallback execution plan based on local heuristics.",
            "source": "fallback",
            "tasks": tasks[:max_steps],
        }

    async def generate_plan(self, goal: str, context: Dict[str, Any], max_steps: int = 5) -> Dict[str, Any]:
        max_steps = max(1, min(max_steps, 10))
        planning_prompt = f"""
Goal: {goal}
Context: {json.dumps(context)}

Create an actionable plan with up to {max_steps} steps.
Return strict JSON only:
{{
  "summary": "brief plan summary",
  "tasks": [
    {{
      "title": "short title",
      "goal": "clear executable goal",
      "action_type": "generate_content|optimize_content|schedule_post|publish_post|monitor_engagement|run_automation",
      "context": {{}},
      "requires_human_approval": false
    }}
  ]
}}
        """.strip()

        try:
            response_text = await self.text_service.chat(
                [{"role": "user", "content": [{"text": planning_prompt}]}]
            )
            payload = json.loads(self._strip_code_fences(response_text))
            raw_tasks = payload.get("tasks", [])
            if not isinstance(raw_tasks, list) or not raw_tasks:
                raise ValueError("Planner response missing tasks array")

            tasks = self._normalize_tasks(raw_tasks, max_steps=max_steps)
            return {
                "summary": str(payload.get("summary") or "Generated execution plan."),
                "source": "nova",
                "tasks": tasks,
            }
        except Exception as exc:
            logger.warning("Planner fallback activated: %s", exc)
            return self._fallback_plan(goal=goal, context=context, max_steps=max_steps)
