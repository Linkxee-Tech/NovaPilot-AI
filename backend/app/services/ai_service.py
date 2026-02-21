import logging
from typing import Dict, Any, List, Optional
from app.services.nova.nova_act_service import NovaActService
from app.services.nova.nova_text_service import NovaTextService
from app.services.planning.planner_service import PlannerService

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.act_service = NovaActService()
        self.text_service = NovaTextService()
        self.planner_service = PlannerService(self.text_service)

    # --- Text Generation & Optimization ---
    async def optimize_content(self, content: str, tone: str = "professional", audience: str = "general") -> Dict[str, Any]:
        """Optimizes content for social media engagement."""
        return await self.text_service.optimize_caption(content, tone, audience)

    async def optimize_multimodal_content(
        self,
        content: str,
        tone: str = "professional",
        audience: str = "general",
        media_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Optimizes content using text plus media metadata context."""
        return await self.text_service.optimize_multimodal_caption(
            content,
            tone,
            audience,
            media_context or {},
        )

    async def get_hashtags(self, content: str) -> Dict[str, Any]:
        """Generates relevant hashtags for content."""
        return await self.text_service.generate_hashtags(content)

    async def predict_engagement(self, content: str, platform: str) -> Dict[str, Any]:
        """Predicts engagement potential for a post."""
        return await self.text_service.predict_engagement(content, platform)

    async def get_scheduling_recommendation(self, content: str, platform: str) -> Dict[str, Any]:
        """Recommends best posting time."""
        return await self.text_service.get_posting_recommendations(content, platform)

    async def chat(self, messages: List[Dict[str, Any]]) -> str:
        """General purpose chat interface."""
        return await self.text_service.chat(messages)

    async def generate_plan(
        self,
        goal: str,
        context: Optional[Dict[str, Any]] = None,
        max_steps: int = 5,
    ) -> Dict[str, Any]:
        """Generates a multi-step plan for a high-level user goal."""
        return await self.planner_service.generate_plan(goal, context or {}, max_steps=max_steps)

    # --- Browser Automation (Nova Act) ---
    async def run_automation(self, goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Runs browser automation based on a natural language goal."""
        return await self.act_service.execute_goal(goal, context or {})

# Singleton instance
ai_service = AIService()
