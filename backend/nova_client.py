"""Compatibility helpers for legacy Nova test endpoints."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.services.nova.nova_text_service import NovaTextService

logger = logging.getLogger(__name__)


def _extract_post_text(payload: Any) -> str:
    if isinstance(payload, str):
        return NovaTextService._sanitize_caption(payload)
    if isinstance(payload, dict):
        for key in ("post", "content", "text", "message"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return NovaTextService._sanitize_caption(value)
        return NovaTextService._sanitize_caption(json.dumps(payload))
    return NovaTextService._sanitize_caption(str(payload))


def generate_post(prompt: str) -> str:
    """
    Generate a single social post from a free-form prompt.
    Kept for compatibility with `app.main:/test-nova`.
    """
    cleaned_prompt = (prompt or "").strip()
    if not cleaned_prompt:
        cleaned_prompt = "Share a short update about AI automation value."

    service = NovaTextService()

    if service.demo_mode:
        return (
            "[Demo Mode] "
            f"{cleaned_prompt}\n\n"
            "Outcome: reduced manual effort, faster execution, measurable impact."
        )

    system_prompt = (
        "You are a senior social media copywriter. "
        "Write one concise, professional LinkedIn post."
    )
    user_prompt = (
        f"Prompt: {cleaned_prompt}\n"
        'Return valid JSON only with this schema: {"post": "<final text>"}'
    )

    try:
        raw = service._invoke_nova(system_prompt, user_prompt)
        return _extract_post_text(raw)
    except Exception as exc:
        logger.exception("generate_post failed: %s", exc)
        raise
