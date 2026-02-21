from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.db import Base
from app.models.post import Platform

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(Enum(Platform), nullable=False)
    username = Column(String, nullable=False)
    encrypted_credentials = Column(Text, nullable=False)  # Encrypted JSON string
    status = Column(String, default="active")
    
    # Relationships
    user = relationship("User", back_populates="social_accounts")
