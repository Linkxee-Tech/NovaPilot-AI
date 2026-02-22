import logging
import json
import re
import unicodedata
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.core.aws import get_aws_client
from app.core.exceptions import PlatformError
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
AUTH_ERROR_CODES = {"UnrecognizedClientException", "InvalidClientTokenId", "ExpiredTokenException"}
CAPTION_PREFIX_RE = re.compile(r"^\s*(optimized\s+caption|caption)\s*:\s*", re.IGNORECASE)
HASHTAG_SECTION_RE = re.compile(r"\n?\s*#+\s*hashtags?\s*:.*$", re.IGNORECASE | re.DOTALL)
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\uFEFF]")
MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")
MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
SMART_PUNCT_MAP = str.maketrans(
    {
        "\u2018": "'",
        "\u2019": "'",
        "\u201C": '"',
        "\u201D": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2026": "...",
        "\u00A0": " ",
    }
)

class NovaTextService:
    def __init__(self):
        self.demo_mode = settings.DEMO_MODE
        self.client = None
        if not self.demo_mode:
            self.client = get_aws_client("bedrock-runtime")
        self.model_id = settings.NOVA_TEXT_MODEL_ID

    @staticmethod
    def _is_auth_error(exc: ClientError) -> bool:
        code = exc.response.get("Error", {}).get("Code")
        return code in AUTH_ERROR_CODES

    def _refresh_client(self) -> None:
        if not self.demo_mode:
            self.client = get_aws_client("bedrock-runtime")

    def _converse_with_retry(self, **kwargs) -> dict:
        if self.client is None:
            raise RuntimeError("Bedrock client is unavailable (demo mode enabled)")
        try:
            return self.client.converse(**kwargs)
        except ClientError as exc:
            if not self._is_auth_error(exc):
                raise

            code = exc.response.get("Error", {}).get("Code", "Unknown")
            logger.warning("Bedrock auth error (%s). Refreshing client and retrying once.", code)
            self._refresh_client()

            try:
                return self.client.converse(**kwargs)
            except ClientError as retry_exc:
                if self._is_auth_error(retry_exc):
                    raise PlatformError(
                        "AWS credentials/token invalid for Bedrock. "
                        "Run `aws sts get-caller-identity` and restart the backend."
                    )
                raise

    @staticmethod
    def _normalize_model_payload(data: Any) -> Any:
        """
        Normalize common model responses where fields are wrapped as:
        {"properties": {"field": {"value": ...}}}
        """
        if not isinstance(data, dict):
            return data

        properties = data.get("properties")
        if isinstance(properties, dict):
            normalized = {}
            found = False
            for key, value in properties.items():
                if isinstance(value, dict) and "value" in value:
                    normalized[key] = value.get("value")
                    found = True
            if found:
                return normalized

        # Fallback: {"field": {"value": ...}, ...}
        if data and all(isinstance(v, dict) and "value" in v for v in data.values()):
            return {k: v.get("value") for k, v in data.items()}

        return data

    @staticmethod
    def _sanitize_text(value: str, allow_newlines: bool = True) -> str:
        if not isinstance(value, str):
            return ""

        text = unicodedata.normalize("NFKC", value)
        text = text.translate(SMART_PUNCT_MAP)
        text = ZERO_WIDTH_RE.sub("", text)
        text = CONTROL_CHAR_RE.sub("", text)
        # Drop symbol glyph noise (emoji/pictographs) that often appears in generated output.
        text = "".join(ch for ch in text if unicodedata.category(ch) != "So")

        if allow_newlines:
            text = text.replace("\r\n", "\n").replace("\r", "\n")
            text = MULTI_NEWLINE_RE.sub("\n\n", text)
        else:
            text = text.replace("\r", " ").replace("\n", " ")

        text = MULTI_SPACE_RE.sub(" ", text)
        return text.strip()

    @classmethod
    def _sanitize_caption(cls, value: str) -> str:
        text = cls._sanitize_text(value, allow_newlines=True)
        text = CAPTION_PREFIX_RE.sub("", text)
        text = HASHTAG_SECTION_RE.sub("", text).strip()
        if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
            text = text[1:-1].strip()
        return text

    @classmethod
    def _sanitize_hashtags(cls, values: Any) -> List[str]:
        if not isinstance(values, list):
            return []

        seen: set[str] = set()
        cleaned: List[str] = []
        for item in values:
            raw = cls._sanitize_text(str(item), allow_newlines=False)
            raw = raw.lstrip("#")
            raw = re.sub(r"[^A-Za-z0-9_]+", "", raw)
            if not raw:
                continue
            tag = f"#{raw}"
            key = tag.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(tag)

        return cleaned[:15]

    @classmethod
    def _sanitize_response_payload(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(payload)

        if isinstance(data.get("optimized_caption"), str):
            data["optimized_caption"] = cls._sanitize_caption(data["optimized_caption"])

        if "hashtags" in data:
            data["hashtags"] = cls._sanitize_hashtags(data.get("hashtags"))

        if isinstance(data.get("engagement_tips"), list):
            tips: List[str] = []
            for tip in data["engagement_tips"]:
                cleaned = cls._sanitize_text(str(tip), allow_newlines=False)
                if cleaned:
                    tips.append(cleaned)
            data["engagement_tips"] = tips[:10]

        if isinstance(data.get("reasoning"), str):
            data["reasoning"] = cls._sanitize_text(data["reasoning"], allow_newlines=True)

        return data

    def _invoke_nova(self, system_prompt: str, user_prompt: str, response_model=None) -> dict:
        """
        Helper to invoke Amazon Nova Pro and parse structured JSON response.
        """
        try:
            # Construct the prompt with strict JSON requirements
            formatted_prompt = f"""
            {user_prompt}
            
            IMPORTANT: Return valid JSON only. No markdown formatting. No explanation.
            Match this schema: {response_model.model_json_schema() if response_model else 'JSON'}
            """

            response = self._converse_with_retry(
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
            data = self._normalize_model_payload(data)
            
            if response_model:
                try:
                    validated = response_model(**data)
                    return self._sanitize_response_payload(validated.model_dump())
                except Exception as e:
                    logger.error(f"Schema validation failed: {e}. Raw: {data}")
                    raise ValueError("Nova response did not match expected schema")
            
            return data

        except PlatformError:
            raise
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
            
            response = self._converse_with_retry(
                modelId=model_id,
                messages=messages,
                inferenceConfig={
                    "maxTokens": 1000,
                    "temperature": 0.7
                }
            )
            raw_text = response['output']['message']['content'][0]['text']
            return self._sanitize_text(raw_text, allow_newlines=True)
        except Exception as e:
            logger.error(f"Nova Chat Error: {e}")
            if self.demo_mode:
                return self._mock_chat(messages)
            return "I apologize, but I am currently unable to process your request."
