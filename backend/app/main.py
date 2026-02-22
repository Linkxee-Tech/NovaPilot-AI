from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import api_router
from app.core.config import settings
import time
from collections import defaultdict
import os
import redis
from sqlalchemy import text
from nova_client import generate_post
from app import models # Ensure all models are registered

from app.core.db import engine, Base
# Create tables on startup (simple for dev/MVP)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NovaPilot AI - Powered by Amazon Nova",
    version="2.0.0"
)


@app.get("/test-nova")
def test_nova():
    result = generate_post("Generate a professional LinkedIn post about AI automation.")
    return {"nova_response": result}

# Configure CORS
# WARNING: allow_origins=["*"] is insecure for production.
# Use environment variables to set specific origins.
environment = os.getenv("ENV", "development").lower()
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
allow_origin_regex = None
if environment != "production":
    # Allow local frontend dev servers (e.g. Vite on 5173/5174/etc).
    allow_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Relax CSP to allow Swagger UI (requires unsafe-inline for scripts/styles)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data: https://fastapi.tiangolo.com; "
        "connect-src 'self';"
    )
    return response

import uuid

@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
    # Store trace_id in request state for downstream use
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    return response

# Simple in-memory rate limiter (Token Bucket)
# implementation for demonstration. In prod use Redis via 'slowapi'
request_counts = defaultdict(list)
RATE_LIMIT = 100  # requests per minute for default routes
AUTH_RATE_LIMIT = 20  # tighter control for auth endpoints
AUTOMATION_RATE_LIMIT = 60  # moderate protection for automation APIs
TIME_WINDOW = 60  # seconds


def _resolve_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _route_bucket(path: str) -> tuple[str, int]:
    if path.startswith("/api/v1/auth"):
        return ("auth", AUTH_RATE_LIMIT)
    if path.startswith("/api/v1/automation"):
        return ("automation", AUTOMATION_RATE_LIMIT)
    return ("default", RATE_LIMIT)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limit for docs and health
    if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health", "/api/v1/health", "/favicon.ico"]:
        return await call_next(request)

    client_ip = _resolve_client_ip(request)
    bucket, route_limit = _route_bucket(request.url.path)
    key = f"{client_ip}:{bucket}"

    now = time.time()
    
    # Clean old requests
    request_counts[key] = [t for t in request_counts[key] if now - t < TIME_WINDOW]
    
    if len(request_counts[key]) >= route_limit:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
        
    request_counts[key].append(now)
    return await call_next(request)

@app.get("/")
async def root():
    return {
        "message": "NovaPilot AI System Operational", 
        "engine": "Amazon Nova via AWS Bedrock",
        "status": "active"
    }

@app.get("/health", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """
    Check system health and core dependency connectivity.
    """
    db_ok = True
    redis_ok = True
    db_error = None
    redis_error = None

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        db_ok = False
        db_error = str(exc)

    redis_client = None
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        redis_ok = bool(redis_client.ping())
    except Exception as exc:
        redis_ok = False
        redis_error = str(exc)
    finally:
        if redis_client is not None:
            try:
                redis_client.close()
            except Exception:
                pass

    overall_status = "healthy" if db_ok and redis_ok else "degraded"

    return {
        "status": overall_status,
        "timestamp": time.time(),
        "version": "2.0.0",
        "environment": os.getenv("ENV", "development"),
        "features": {
            "ai_engine": True,
            "database": db_ok,
            "storage": True
        },
        "dependencies": {
            "database": {"ok": db_ok, "error": db_error},
            "redis": {"ok": redis_ok, "error": redis_error},
        },
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # 204 responses must not include a body.
    return Response(status_code=204)

from app.core.exceptions import NovaError, AuthError, PlatformError, RateLimitError, SelectorError, CircuitBreakerError
import traceback

@app.exception_handler(NovaError)
async def nova_exception_handler(request: Request, exc: NovaError):
    status_code = 500
    if isinstance(exc, AuthError):
        status_code = 401
    elif isinstance(exc, RateLimitError):
        status_code = 429
    elif isinstance(exc, (PlatformError, SelectorError, CircuitBreakerError)):
        status_code = 502 # Bad Gateway for external service failures
    
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": str(exc),
            "type": exc.__class__.__name__,
            "trace_id": getattr(request.state, "trace_id", None)
        }
    )

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    # Log the full traceback for unhandled exceptions
    print(f"DEBUG ERROR: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500, 
        content={
            "detail": "Internal Server Error",
            "type": exc.__class__.__name__,
            "trace_id": getattr(request.state, "trace_id", None)
        }
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve static files
os.makedirs("uploads/posts", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
