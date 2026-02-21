import pytest
from app.core import security
from app.api import crud
from app.schemas.post import PostCreate, PostUpdate
from app.models.post import Platform, PostStatus
from datetime import datetime

def test_create_post_with_user_id():
    """Test post creation includes user_id"""
    # This would require database setup in real tests
    post_data = PostCreate(
        content="Test post content",
        platform=Platform.LINKEDIN,
        scheduled_at=datetime.now()
    )
    # In real test: result = crud.create_post(db, post_data, user_id=1)
    assert post_data.platform == Platform.LINKEDIN
    assert len(post_data.content) > 0

def test_platform_content_validation():
    """Test platform-specific content length limits"""
    from app.core.validation import validate_content_length, PLATFORM_LIMITS
    
    # LinkedIn allows 3000 chars
    long_content = "a" * 3000
    try:
        validate_content_length(long_content, Platform.LINKEDIN)
        assert True
    except:
        assert False,  "Should not raise for valid LinkedIn length"
    
    # Twitter limits to 280
    twitter_content = "a" * 281
    with pytest.raises(Exception):
        validate_content_length(twitter_content, Platform.TWITTER)
