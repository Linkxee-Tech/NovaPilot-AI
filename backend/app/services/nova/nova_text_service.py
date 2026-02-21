import logging
import json
import boto3
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.services.nova.schemas import (
    OptimizedContent,
    HashtagResponse,
    EngagementPrediction,
    PostingTimeRecommendation,
    MultimodalOptimizedContent,
)
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class NovaTextService:
    def __init__(self):
        self.demo_mode = settings.DEMO_MODE
        self.client = None
        if not self.demo_mode:
            self.client = boto3.client(
                service_name='bedrock-runtime',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        self.model_id = settings.NOVA_TEXT_MODEL_ID

    def _invoke_nova(self, system_prompt: str, user_prompt: str, response_model=None) -> dict:
        """
        Helper to invoke Amazon Nova Pro and parse structured JSON response.
        """
        if self.client is None:
            raise RuntimeError("Bedrock client is unavailable (demo mode enabled)")
        try:
            # Construct the prompt with strict JSON requirements
            formatted_prompt = f"""
            {user_prompt}
            
            IMPORTANT: Return valid JSON only. No markdown formatting. No explanation.
            Match this schema: {response_model.model_json_schema() if response_model else 'JSON'}
            """

            response = self.client.converse(
                modelId=self.model_id,
                messages=[{
                    "role": "user",
                    "content": [{"text": formatted_prompt}]
                }],
                system=[{"text": system_prompt}],
                inferenceConfig={
                    "maxTokens": 2048,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            )

            response_text = response['output']['message']['content'][0]['text']
            
            # Clean up potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            data = json.loads(response_text)
            
            if response_model:
                try:
                    validated = response_model(**data)
                    return validated.model_dump()
                except Exception as e:
                    logger.error(f"Schema validation failed: {e}. Raw: {data}")
                    raise ValueError("Nova response did not match expected schema")
            
            return data

        except ClientError as e:
            logger.error(f"Amazon Bedrock ClientError: {e}")
            raise
        except Exception as e:
            logger.error(f"Nova Text Service Error: {e}")
            raise

    @staticmethod
    def _extract_keywords(caption: str, limit: int = 5) -> List[str]:
        tokens = [t.strip(".,!?;:()[]{}\"'").lower() for t in caption.split()]
        candidates = [t for t in tokens if len(t) > 3 and t.isalnum()]
        deduped: List[str] = []
        for item in candidates:
            if item not in deduped:
                deduped.append(item)
            if len(deduped) >= limit:
                break
        return deduped

    @classmethod
    def _mock_hashtags(cls, content: str, limit: int = 10) -> List[str]:
        extracted = cls._extract_keywords(content, limit=limit)
        base = [f"#{tag}" for tag in extracted if tag]
        if not base:
            base = ["#NovaPilot", "#AI", "#Automation", "#SocialMedia"]
        return base[:limit]

    @classmethod
    def _mock_optimize_caption(cls, caption: str, tone: str, target_audience: str) -> Dict[str, Any]:
        tone_fragment = tone.strip().capitalize() if tone else "Professional"
        audience_fragment = target_audience.strip() if target_audience else "general audience"
        optimized = (
            f"{tone_fragment} update for {audience_fragment}: {caption.strip()} "
            "What is your perspective on this?"
        ).strip()
        return {
            "optimized_caption": optimized,
            "hashtags": cls._mock_hashtags(caption, limit=8),
            "engagement_tips": [
                "Open with a clear value statement.",
                "Keep one specific call-to-action.",
                "Use concise, mobile-friendly sentence length.",
            ],
        }

    @classmethod
    def _mock_generate_hashtags(cls, content: str) -> Dict[str, Any]:
        return {"hashtags": cls._mock_hashtags(content, limit=12)}

    @staticmethod
    def _mock_predict_engagement(platform: str) -> Dict[str, Any]:
        platform_score = {
            "linkedin": 78.0,
            "twitter": 71.0,
        }
        score = platform_score.get(platform.lower(), 74.0)
        confidence = "High" if score >= 75 else "Medium"
        return {"prediction_score": score, "confidence_level": confidence}

    @staticmethod
    def _mock_posting_recommendation(platform: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        if platform.lower() == "linkedin":
            candidate = now + timedelta(hours=2)
            reasoning = "LinkedIn engagement is usually stronger during business hours."
        else:
            candidate = now + timedelta(hours=1)
            reasoning = "Short-form platforms often reward frequent, time-relevant posting."
        return {
            "best_time": candidate.isoformat(),
            "reasoning": reasoning,
        }

    @staticmethod
    def _mock_chat(messages: list) -> str:
        prompt_text = ""
        for message in reversed(messages):
            if message.get("role") == "user":
                for chunk in message.get("content", []):
                    text = chunk.get("text")
                    if text:
                        prompt_text = text
                        break
            if prompt_text:
                break
        prompt_text = prompt_text.strip() or "your request"
        return (
            "[Demo Mode] Suggested response:\n"
            f"{prompt_text[:180]}\n\n"
            "Proposed CTA: Share one measurable outcome and invite feedback."
        )

    async def optimize_caption(self, caption: str, tone: str, target_audience: str) -> dict:
        from app.services.nova.prompts import OPTIMIZE_CAPTION_SYSTEM, get_optimize_prompt
        if self.demo_mode:
            return self._mock_optimize_caption(caption, tone, target_audience)
        return self._invoke_nova(
            OPTIMIZE_CAPTION_SYSTEM,
            get_optimize_prompt(caption, tone, target_audience),
            response_model=OptimizedContent,
        )

    @staticmethod
    def _local_multimodal_fallback(caption: str, media_context: Dict[str, Any]) -> Dict[str, Any]:
        media_type = str(media_context.get("media_type") or "media")
        file_name = str(media_context.get("filename") or "attachment")
        keywords = NovaTextService._extract_keywords(caption)
        hashtags = [f"#{word}" for word in keywords] or ["#AI", "#Automation", "#SocialMedia"]

        alt_text = media_context.get("suggested_alt_text")
        if not alt_text:
            alt_text = f"{media_type.capitalize()} content related to: {caption[:80]}".strip()

        return {
            "optimized_caption": caption.strip(),
            "hashtags": hashtags[:12],
            "engagement_tips": [
                "Start with a clear first sentence.",
                "Add one direct call-to-action at the end.",
                "Keep sentence length short for mobile readability.",
            ],
            "media_insights": {
                "media_type": media_type,
                "summary": f"Use the attached {media_type} ({file_name}) to reinforce the main message.",
                "suggested_alt_text": alt_text,
                "content_hooks": [
                    "Lead with the key visual takeaway.",
                    "Reference one concrete detail from the media.",
                ],
            },
        }

    async def optimize_multimodal_caption(
        self,
        caption: str,
        tone: str,
        target_audience: str,
        media_context: Dict[str, Any],
    ) -> dict:
        from app.services.nova.prompts import MULTIMODAL_OPTIMIZE_SYSTEM, get_multimodal_optimize_prompt

        if self.demo_mode:
            return self._local_multimodal_fallback(caption, media_context)

        prompt = get_multimodal_optimize_prompt(
            caption,
            tone,
            target_audience,
            json.dumps(media_context),
        )
        try:
            return self._invoke_nova(
                MULTIMODAL_OPTIMIZE_SYSTEM,
                prompt,
                response_model=MultimodalOptimizedContent,
            )
        except Exception as exc:
            logger.warning("Multimodal optimization fallback activated: %s", exc)
            return self._local_multimodal_fallback(caption, media_context)

    async def generate_hashtags(self, content: str) -> dict:
        from app.services.nova.prompts import HASHTAG_STRATEGY_SYSTEM, get_hashtag_prompt
        if self.demo_mode:
            return self._mock_generate_hashtags(content)
        return self._invoke_nova(
            HASHTAG_STRATEGY_SYSTEM,
            get_hashtag_prompt(content),
            response_model=HashtagResponse,
        )

    async def predict_engagement(self, content: str, platform: str) -> dict:
        from app.services.nova.prompts import ENGAGEMENT_PREDICTION_SYSTEM, get_engagement_prompt
        if self.demo_mode:
            return self._mock_predict_engagement(platform)
        return self._invoke_nova(
            ENGAGEMENT_PREDICTION_SYSTEM,
            get_engagement_prompt(content, platform),
            response_model=EngagementPrediction,
        )
    
    async def get_posting_recommendations(self, content: str, platform: str) -> dict:
        from app.services.nova.prompts import SCHEDULER_EXPERT_SYSTEM, get_scheduling_prompt
        if self.demo_mode:
            return self._mock_posting_recommendation(platform)
        return self._invoke_nova(
            SCHEDULER_EXPERT_SYSTEM,
            get_scheduling_prompt(content, platform),
            response_model=PostingTimeRecommendation,
        )

    async def chat(self, messages: list) -> str:
        """
        Conversational interface for Nova Pro/Micro.
        messages: List of {"role": "user"|"assistant", "content": [{"text": "..."}]}
        """
        if self.demo_mode:
            return self._mock_chat(messages)
        try:
            # Use same model as other text services
            model_id = self.model_id
            
            response = self.client.converse(
                modelId=model_id,
                messages=messages,
                inferenceConfig={
                    "maxTokens": 1000,
                    "temperature": 0.7
                }
            )
            return response['output']['message']['content'][0]['text']
        except Exception as e:
            logger.error(f"Nova Chat Error: {e}")
            if self.demo_mode:
                return self._mock_chat(messages)
            return "I apologize, but I am currently unable to process your request."
