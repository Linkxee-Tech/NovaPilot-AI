from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.api import crud
from app.core.db import get_db
from app.schemas.analytics import Analytics
import csv
import io

router = APIRouter()

@router.get("/export/csv")
def export_analytics_csv(db: Session = Depends(get_db)):
    """
    Export all analytics data as a CSV file.
    """
    from app.models.analytics import Analytics as AnalyticsModel
    
    analytics_list = db.query(AnalyticsModel).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Post ID", "Impressions", "Clicks", "Shares", "Comments", "Engagement Rate"])
    
    # Data
    for row in analytics_list:
        writer.writerow([
            row.post_id,
            row.impressions,
            row.clicks,
            row.shares,
            row.comments,
            row.engagement_rate
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nova_analytics_export.csv"}
    )

@router.get("/{post_id}", response_model=Analytics)
def read_post_analytics(post_id: int, db: Session = Depends(get_db)):
    from app.models.analytics import Analytics as AnalyticsModel
    
    analytics = db.query(AnalyticsModel).filter(AnalyticsModel.post_id == post_id).first()
    
    if not analytics:
        # Create empty analytics if none exist
        analytics = AnalyticsModel(
            post_id=post_id,
            impressions=0,
            clicks=0,
            shares=0,
            comments=0,
            engagement_rate="0.0%"
        )
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    
    return analytics


@router.get("/", response_model=List[Analytics])
def read_all_analytics(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from app.models.analytics import Analytics as AnalyticsModel
    
    analytics_list = db.query(AnalyticsModel).offset(skip).limit(limit).all()
    return analytics_list

