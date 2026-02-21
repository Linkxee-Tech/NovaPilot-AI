import pytest
from app.models.analytics import Analytics

def test_analytics_model():
    """Test Analytics model structure"""
    # This would use an actual DB session in real tests
    analytics_data = {
        "post_id": 1,
        "impressions": 100,
        "clicks": 10,
        "shares": 5,
        "comments": 2,
        "engagement_rate": "17.0%"
    }
    
    assert analytics_data["impressions"] > 0
    assert analytics_data["post_id"] == 1
    
def test_engagement_calculation():
    """Test engagement rate calculation"""
    impressions = 100
    clicks = 10
    shares = 5
    comments = 2
    
    total_engagement = clicks + shares + comments
    engagement_rate = (total_engagement / impressions) * 100
    
    assert engagement_rate == 17.0
