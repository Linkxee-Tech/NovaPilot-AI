"""
Database Initialization Script
Creates all tables for NovaPilot AI backend
"""
from app.core.db import Base, engine
from app.models.user import User
from app.models.account import SocialAccount
from app.models.post import Post, Draft
from app.models.analytics import Analytics
from app.models.audit_log import AuditLog
from app.models.selector import Selector

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    init_db()
