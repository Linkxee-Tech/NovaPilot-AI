from sqlalchemy import Column, Integer, String, DateTime
from app.core.db import Base
from datetime import datetime

class Selector(Base):
    __tablename__ = "selectors"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True)
    element_name = Column(String, index=True)
    selector_value = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
