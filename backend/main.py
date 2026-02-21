"""
Compatibility ASGI entrypoint.

Allows running either:
    uvicorn main:app
or:
    uvicorn app.main:app
from the backend directory.
"""

from app.main import app

