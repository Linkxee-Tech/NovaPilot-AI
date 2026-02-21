from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base
import enum
from datetime import datetime

class PostStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PUBLISHED = "published"
    FAILED = "failed"
    DRAFT = "draft"

class Platform(str, enum.Enum):
    LINKEDIN = "linkedin"
    TWITTER = "twitter"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    platform = Column(Enum(Platform), nullable=False)
    status = Column(Enum(PostStatus), default=PostStatus.SCHEDULED)
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="posts")
    analytics = relationship("Analytics", back_populates="post", uselist=False)


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    platform = Column(Enum(Platform), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="drafts")

