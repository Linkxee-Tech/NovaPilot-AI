from fastapi import APIRouter
from app.api.endpoints import auth, posts, automation, analytics, accounts, audit, chat, platforms

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"], prefix="/auth")
api_router.include_router(posts.router, tags=["posts"], prefix="/posts")
api_router.include_router(automation.router, tags=["automation"], prefix="/automation")
api_router.include_router(analytics.router, tags=["analytics"], prefix="/analytics")
api_router.include_router(accounts.router, tags=["accounts"], prefix="/accounts")
api_router.include_router(audit.router, tags=["audit"], prefix="/audit")
api_router.include_router(chat.router, tags=["chat"], prefix="/chat")
api_router.include_router(platforms.router, tags=["platforms"], prefix="/platforms")


