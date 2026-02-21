from sqlalchemy import Column, String, JSON, DateTime, Integer, Text
from app.core.db import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    status = Column(String, default="pending")
    platform = Column(String, nullable=True)
    user = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    evidence_hash = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
