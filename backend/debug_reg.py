import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.api import crud_user
from app.schemas.auth import UserCreate
from app.models.user import User

def test_registration():
    db = SessionLocal()
    try:
        user_in = UserCreate(
            email="test_fix_debug@example.com",
            password="testpassword123",
            full_name="Debug Tester"
        )
        print(f"Attempting to create user: {user_in.email}")
        user = crud_user.create_user(db, user_in=user_in)
        print(f"User created successfully: {user.id}")
        # Clean up
        db.delete(user)
        db.commit()
        print("Cleanup successful")
    except Exception as e:
        print(f"ERROR DURING REGISTRATION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_registration()
