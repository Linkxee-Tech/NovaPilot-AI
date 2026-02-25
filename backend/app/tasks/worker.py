from celery import Celery
from app.core.config import settings
import asyncio
import logging
from app.api import crud
from app.services.ai_service import ai_service
from app.services.audit_service import AuditService
from app.core.db import SessionLocal
from app.schemas.post import PostUpdate
from app.models.error_codes import ErrorCode
import uuid
from datetime import datetime
from app.core.event_bus import publish_event

# Configure logger
logger = logging.getLogger(__name__)

celery_app = Celery(
    "nova_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Robust Redis connection check for synchronous fallback (Eager Mode)
_is_redis_available = False
if settings.REDIS_URL and not settings.REDIS_URL.startswith("redis://localhost"):
    try:
        import redis
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        if client.ping():
            _is_redis_available = True
        client.close()
    except Exception:
        _is_redis_available = False

# Enable task_always_eager (Synchronous execution) if Redis is unavailable or not required.
# This prevents 111 Connection Refused errors in environments without a separate worker process.
should_be_eager = not _is_redis_available or not settings.REDIS_REQUIRED

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_concurrency=4,
    task_always_eager=should_be_eager,
    task_eager_propagates=True
)

# Service is used via ai_service singleton

@celery_app.task(bind=True, max_retries=5)
def execute_post_publication(self, post_id: int, trace_id: str = None):
    db = SessionLocal()
    audit_log = None
    current_trace_id = trace_id or str(uuid.uuid4())
    task_id = self.request.id

    try:
        post = crud.get_post(db, post_id)
        if not post:
            logger.error(f"Post {post_id} not found")
            publish_event({
                "level": "ERROR",
                "message": f"Post {post_id} not found",
                "trace_id": current_trace_id,
                "task_id": task_id,
                "post_id": post_id
            })
            return {"status": "failed", "error": f"Post {post_id} not found", "trace_id": current_trace_id}

        # Update status to running
        crud.update_post(db, post_id=post_id, post_in=PostUpdate(status="running"))
        self.update_state(
            state="RUNNING",
            meta={
                "retry_count": self.request.retries,
                "trace_id": current_trace_id,
                "post_id": post_id,
                "platform": str(post.platform)
            }
        )
        publish_event({
            "level": "INFO",
            "message": f"Started publishing post {post_id}",
            "trace_id": current_trace_id,
            "task_id": task_id,
            "post_id": post_id,
            "platform": str(post.platform),
            "status": "running"
        })

        # Create initial audit log
        audit_payload = {
            "post_id": post_id,
            "platform": str(post.platform),
            "content": post.content
        }
        
        audit_log = AuditService.create_audit_log(
            db=db,
            action_id=current_trace_id,
            goal=f"Publish to {post.platform.value}",
            payload=audit_payload,
            user_id=str(post.user_id) if post.user_id else None,
            platform=str(post.platform)
        )

        try:
            # Run Async Nova Act Service
            # We need a fresh loop for each task in Celery worker
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            goal = f"Publish content to {post.platform.value}"
            context = {
                "content": post.content, 
                "platform": post.platform.value,
                "post_id": post_id
            }

            try:
                results = loop.run_until_complete(ai_service.run_automation(goal, context))
            finally:
                loop.close()

            if results["status"] == "success":
                crud.update_post(
                    db,
                    post_id=post_id,
                    post_in=PostUpdate(status="published", published_at=datetime.utcnow())
                )
                AuditService.update_audit_log(db, audit_log.id, status="SUCCESS", result=results)
                publish_event({
                    "level": "INFO",
                    "message": f"Published post {post_id} successfully",
                    "trace_id": current_trace_id,
                    "task_id": task_id,
                    "post_id": post_id,
                    "status": "success"
                })
                return {
                    "status": "success",
                    "post_id": post_id,
                    "trace_id": current_trace_id,
                    "retry_count": self.request.retries
                }
            else:
                raise Exception(f"Nova Act execution failed: {results.get('error')}")

        except Exception as e:
            logger.error(f"Execution Error: {e}")
            crud.update_post(db, post_id=post_id, post_in=PostUpdate(status="failed"))
            
            # Categorize error
            error_code = ErrorCode.SYSTEM_ERROR
            error_msg = str(e).lower()
            if "timeout" in error_msg:
                error_code = ErrorCode.TIMEOUT
            elif "auth" in error_msg or "login" in error_msg:
                error_code = ErrorCode.AUTH_FAILED
            elif "rate" in error_msg or "limit" in error_msg:
                error_code = ErrorCode.RATE_LIMITED

            if audit_log:
                AuditService.update_audit_log(
                    db,
                    audit_log.id,
                    status="FAILED",
                    error=str(e),
                    error_code=error_code.value
                )

            publish_event({
                "level": "ERROR",
                "message": f"Post {post_id} failed: {str(e)}",
                "trace_id": current_trace_id,
                "task_id": task_id,
                "post_id": post_id,
                "status": "failed",
                "error_code": error_code.value
            })

            if self.request.retries < self.max_retries:
                retry_count = self.request.retries + 1
                countdown = 60 * (2 ** self.request.retries)
                self.update_state(
                    state="RETRY",
                    meta={
                        "retry_count": retry_count,
                        "trace_id": current_trace_id,
                        "post_id": post_id,
                        "error_code": error_code.value,
                        "error": str(e)
                    }
                )
                publish_event({
                    "level": "WARNING",
                    "message": f"Retrying post {post_id} (attempt {retry_count})",
                    "trace_id": current_trace_id,
                    "task_id": task_id,
                    "post_id": post_id,
                    "status": "retrying",
                    "retry_count": retry_count
                })
                raise self.retry(exc=e, countdown=countdown)

            return {
                "status": "failed",
                "post_id": post_id,
                "trace_id": current_trace_id,
                "retry_count": self.request.retries,
                "error": str(e),
                "error_code": error_code.value
            }

    except Exception as e:
        logger.error(f"Critical Worker Error: {e}")
        # Only try to update DB if we can
        try:
           crud.update_post(db, post_id=post_id, post_in=PostUpdate(status="failed"))
        except:
           pass
        publish_event({
            "level": "ERROR",
            "message": f"Critical error for post {post_id}: {str(e)}",
            "trace_id": current_trace_id,
            "task_id": task_id,
            "post_id": post_id,
            "status": "failed"
        })
        return {
            "status": "failed",
            "post_id": post_id,
            "trace_id": current_trace_id,
            "retry_count": self.request.retries,
            "error": str(e)
        }
    finally:
        db.close()

@celery_app.task(bind=True)
def execute_act_goal_task(self, goal: str, context: dict = None):
    """
    Task to execute a specific Nova Act goal.
    """
    trace_id = str(uuid.uuid4())
    publish_event({
        "level": "INFO",
        "message": f"Starting automation goal: {goal}",
        "trace_id": trace_id,
        "task_id": self.request.id,
        "status": "running"
    })

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        results = loop.run_until_complete(ai_service.run_automation(goal, context or {}))
        publish_event({
            "level": "INFO" if results.get("status") == "success" else "ERROR",
            "message": f"Completed automation goal: {goal}",
            "trace_id": trace_id,
            "task_id": self.request.id,
            "status": results.get("status", "unknown")
        })
        return results
    finally:
        loop.close()
