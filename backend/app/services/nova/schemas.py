from pydantic import BaseModel, Field
from typing import List, Optional

class OptimizedContent(BaseModel):
    optimized_caption: str = Field(..., description="The refined caption text")
    hashtags: List[str] = Field(..., description="List of relevant hashtags")
    engagement_tips: List[str] = Field(..., description="Tips to increase engagement")

class HashtagResponse(BaseModel):
    hashtags: List[str] = Field(..., description="Generated hashtags")

class EngagementPrediction(BaseModel):
    prediction_score: float = Field(..., ge=0, le=100, description="Predicted engagement score")
    confidence_level: str = Field(..., description="High, Medium, or Low")

class PostingTimeRecommendation(BaseModel):
    best_time: str = Field(..., description="Recommended posting time (ISO 8601 or readable)")
    reasoning: str = Field(..., description="Why this time is recommended")

class AnalyticsSummary(BaseModel):
    summary: str = Field(..., description="Natural language summary of analytics")
    key_metrics: dict = Field(..., description="Key metrics highlighted in the summary")


class MediaInsights(BaseModel):
    media_type: str = Field(..., description="Detected media type, e.g., image or video")
    summary: str = Field(..., description="Short summary of what to emphasize with this media")
    suggested_alt_text: str = Field(..., description="Suggested accessibility alt text")
    content_hooks: List[str] = Field(default_factory=list, description="Potential hooks using the media context")


class MultimodalOptimizedContent(BaseModel):
    optimized_caption: str = Field(..., description="The refined caption text")
    hashtags: List[str] = Field(..., description="List of relevant hashtags")
    engagement_tips: List[str] = Field(..., description="Tips to increase engagement")
    media_insights: MediaInsights = Field(..., description="Insights extracted from media context")
