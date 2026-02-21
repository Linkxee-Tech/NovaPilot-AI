from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.db import Base

class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # e.g., "linkedin", "twitter"
    username = Column(String)
    # In a real app, this should be encrypted using KMS or similar. 
    # For MVP, we will store it securely (simulated encryption in crud).
    encrypted_password = Column(String) 
    cookies = Column(String, nullable=True) # JSON string of session cookies
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="platforms")
