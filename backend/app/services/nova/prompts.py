"""
Modularized prompt templates for Amazon Nova (Pro & Act).
"""

# --- Nova Act (Browser Automation) ---
NOVA_ACT_SYSTEM_PROMPT = "You are an autonomous agent utilizing a browser to achieve user goals."

def get_automation_prompt(goal: str, context: str) -> str:
    return f"""
Goal: {goal}
Context: {context}

Task: Return a JSON object with a list of actions to achieve the goal.
Schema:
{{
    "actions": [
        {{
            "type": "navigate" | "click" | "type" | "wait" | "screenshot",
            "selector": "css_selector" (optional),
            "value": "string_value" (optional),
            "url": "full_url" (optional)
        }}
    ]
}}
IMPORTANT: Return valid JSON only.
"""

# --- Nova Text (Optimization & Analytics) ---
OPTIMIZE_CAPTION_SYSTEM = "You are a social media expert. Optimize content for maximum engagement."
def get_optimize_prompt(caption: str, tone: str, audience: str) -> str:
    return f"Optimize this caption: '{caption}'. Tone: {tone}. Audience: {audience}."

HASHTAG_STRATEGY_SYSTEM = "You are a hashtag strategist. Generate trending and relevant hashtags."
def get_hashtag_prompt(content: str) -> str:
    return f"Generate 10-15 best hashtags for this post: '{content}'."

ENGAGEMENT_PREDICTION_SYSTEM = "You are an AI analytics engine. Predict engagement potential."
def get_engagement_prompt(content: str, platform: str) -> str:
    return f"Predict engagement score (0-100) for this {platform} post: '{content}'."

SCHEDULER_EXPERT_SYSTEM = "You are a social media scheduler expert."
def get_scheduling_prompt(content: str, platform: str) -> str:
    return f"Recommend the best posting time for this {platform} post: '{content}'."

MULTIMODAL_OPTIMIZE_SYSTEM = (
    "You are a multimodal social media strategist. "
    "Use provided media context to optimize copy, accessibility, and engagement guidance."
)

def get_multimodal_optimize_prompt(caption: str, tone: str, audience: str, media_context: str) -> str:
    return (
        f"Optimize this caption: '{caption}'. "
        f"Tone: {tone}. Audience: {audience}. "
        f"Media context (JSON): {media_context}. "
        "Return concise, platform-ready output."
    )
