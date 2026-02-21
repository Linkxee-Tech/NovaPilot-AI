"""
Platform-specific validation for social media content
"""
from fastapi import HTTPException
from app.models.post import Platform

# Platform character limits
PLATFORM_LIMITS = {
    Platform.LINKEDIN: 3000,
    Platform.TWITTER: 280
}

def validate_content_length(content: str, platform: Platform) -> None:
    """
    Validates content length against platform-specific limits
    
    Raises:
        HTTPException: If content exceeds platform limit
    """
    limit = PLATFORM_LIMITS.get(platform)
    if not limit:
        return  # Unknown platform, skip validation
    
    if len(content) > limit:
        raise HTTPException(
            status_code=400,
            detail=f"{platform.value} posts must be {limit} characters or less. Current: {len(content)}"
        )
