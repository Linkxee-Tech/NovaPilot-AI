import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine, Base
# Import all models to register them with Base
from app.models.user import User
from app.models.post import Post, Draft
from app.models.account import SocialAccount
from app.models.platform import Platform
from app.models.audit_log import AuditLog
from app.models.chat import AIChatMessage
from app.models.analytics import Analytics
from app.models.selector import Selector
# Import other models as needed

def reinit_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database re-initialized successfully.")

if __name__ == "__main__":
    reinit_db()
