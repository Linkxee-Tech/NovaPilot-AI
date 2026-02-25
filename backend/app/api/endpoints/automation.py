from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Body, HTTPException, Depends
import json
import asyncio
import logging
from datetime import datetime
import uuid

from app.core.event_bus import subscribe_events, publish_event
from app.core.config import settings
from app.api import deps
from app.schemas.planning import PlanningRequest, PlanningResponse
from app.services.ai_service import ai_service


logger = logging.getLogger(__name__)
router = APIRouter()


def _demo_job_id(prefix: str = "job") -> str:
    return f"demo-{prefix}-{uuid.uuid4().hex[:12]}"


async def _heartbeat_mode(websocket: WebSocket) -> None:
    while True:
        await asyncio.sleep(5)
        fallback = {
            "timestamp": datetime.now().isoformat(),
            "level": "WARNING",
            "message": "Event stream unavailable. Waiting for reconnection...",
            "trace_id": None,
        }
        await websocket.send_text(json.dumps(fallback))

@router.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    initial = {
        "timestamp": datetime.now().isoformat(),
        "level": "INFO",
        "message": "Connected to automation event stream",
        "trace_id": None
    }
    await websocket.send_text(json.dumps(initial))

    # In demo mode, do not attempt Redis pub/sub.
    if settings.DEMO_MODE:
        try:
            await _heartbeat_mode(websocket)
        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected from /automation/ws/logs (demo mode)")
        return

    try:
        async for event in subscribe_events():
            await websocket.send_text(json.dumps(event))
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from /automation/ws/logs")
    except Exception as exc:
        logger.info("Redis event stream unavailable, using heartbeat mode")
        logger.debug("Event stream fallback reason: %s", exc)
        try:
            await _heartbeat_mode(websocket)
        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected during fallback mode")


@router.post("/trigger/{job_type}")
async def trigger_job(job_type: str, payload: dict = Body(...)):
    """
    Triggers a background automation job.
    """
    logger.info(f"Triggering job: {job_type}")

    if settings.DEMO_MODE:
        if job_type not in {"linkedin_login", "scrape_analytics"}:
            raise HTTPException(status_code=400, detail=f"Unknown job type: {job_type}")
        job_id = _demo_job_id(job_type)
        publish_event({
            "level": "INFO",
            "message": f"Completed {job_type} in demo mode",
            "task_id": job_id,
            "status": "success",
            "mode": "demo",
        })
        return {"status": "completed_demo", "job_id": job_id, "job_type": job_type}

    from app.tasks.worker import execute_act_goal_task

    if job_type == "linkedin_login":
        task = execute_act_goal_task.delay("Login to LinkedIn", context=payload)
        publish_event({
            "level": "INFO",
            "message": "Enqueued linkedin_login job",
            "task_id": str(task.id),
            "status": "queued"
        })
        return {"status": "enqueued", "job_id": str(task.id), "job_type": job_type}
    
    elif job_type == "scrape_analytics":
        task = execute_act_goal_task.delay("Scrape analytics from dashboard", context=payload)
        publish_event({
            "level": "INFO",
            "message": "Enqueued scrape_analytics job",
            "task_id": str(task.id),
            "status": "queued"
        })
        return {"status": "enqueued", "job_id": str(task.id), "job_type": job_type}

    raise HTTPException(status_code=400, detail=f"Unknown job type: {job_type}")


@router.post("/run")
async def run_custom_job(payload: dict = Body(...)):
    """
    Trigger an automation job using a custom goal and optional context.
    """
    from app.tasks.worker import execute_act_goal_task

    goal = payload.get("goal")
    context = payload.get("context", {})
    if not goal:
        raise HTTPException(status_code=400, detail="Missing required field: goal")

    if settings.DEMO_MODE:
        job_id = _demo_job_id("run")
        publish_event({
            "level": "INFO",
            "message": f"Completed custom job in demo mode: {goal}",
            "task_id": job_id,
            "status": "success",
            "mode": "demo"
        })
        return {"status": "completed_demo", "job_id": job_id, "goal": goal}

    task = execute_act_goal_task.delay(goal, context=context)
    publish_event({
        "level": "INFO",
        "message": f"Enqueued custom job: {goal}",
        "task_id": str(task.id),
        "status": "queued"
    })
    return {"status": "enqueued", "job_id": str(task.id), "goal": goal}


@router.post("/plan", response_model=PlanningResponse)
async def plan_goal(
    request: PlanningRequest,
    trace_id: str = Depends(deps.get_trace_id),
):
    """
    Generate a multi-step automation plan from a high-level goal.
    Optionally enqueue executable tasks when `execute=true`.
    """
    plan = await ai_service.generate_plan(
        goal=request.goal,
        context=request.context,
        max_steps=request.max_steps,
    )
    tasks = plan.get("tasks", [])

    execution = None
    if request.execute:
        execution = []
        for task in tasks:
            if task.get("requires_human_approval"):
                execution.append(
                    {
                        "task_id": task.get("id", 0),
                        "task_title": task.get("title", "Unknown step"),
                        "status": "skipped_requires_approval",
                        "job_id": None,
                        "error": None,
                    }
                )
                continue

            if settings.DEMO_MODE:
                execution.append(
                    {
                        "task_id": task.get("id", 0),
                        "task_title": task.get("title", "Unknown step"),
                        "status": "completed_demo",
                        "job_id": _demo_job_id("plan"),
                        "error": None,
                    }
                )
                continue

            from app.tasks.worker import execute_act_goal_task
            try:
                queued = execute_act_goal_task.delay(task.get("goal", request.goal), context=task.get("context", {}))
                execution.append(
                    {
                        "task_id": task.get("id", 0),
                        "task_title": task.get("title", "Unknown step"),
                        "status": "enqueued",
                        "job_id": str(queued.id),
                        "error": None,
                    }
                )
            except Exception as exc:
                execution.append(
                    {
                        "task_id": task.get("id", 0),
                        "task_title": task.get("title", "Unknown step"),
                        "status": "failed_to_enqueue",
                        "job_id": None,
                        "error": str(exc),
                    }
                )

    payload = {
        "goal": request.goal,
        "summary": plan.get("summary", "Generated plan"),
        "source": plan.get("source", "fallback"),
        "tasks": tasks,
        "trace_id": trace_id,
        "execution": execution,
    }
    publish_event(
        {
            "level": "INFO",
            "message": f"Generated plan for goal: {request.goal}",
            "trace_id": trace_id,
            "status": "planned",
            "step_count": len(tasks),
            "source": payload["source"],
        }
    )
    return payload


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """
    Retrieve Celery task state and retry metadata for a job.
    """
    if settings.DEMO_MODE and job_id.startswith("demo-"):
        return {
            "job_id": job_id,
            "state": "SUCCESS",
            "ready": True,
            "successful": True,
            "retry_count": 0,
            "trace_id": None,
            "post_id": None,
            "error": None,
            "result": {
                "status": "success",
                "mode": "demo",
            },
        }

    from app.tasks.worker import celery_app as worker_celery
    from app.core.db import SessionLocal
    from app.api import crud

    result = worker_celery.AsyncResult(job_id)
    state = result.state
    error_message = None

    # Fallback: If Celery doesn't know about this job, check the database status
    if state == "PENDING" or not result.ready():
        db = SessionLocal()
        try:
            # Try to find a post associated with this job_id (we store it in the post metadata or just search)
            # Actually, we don't store job_id in the Post model directly in a standard way, 
            # but let's check for any post that might be 'published' or 'failed' recently.
            # A better way is to check the AuditLog if we have a job_id there.
            from app.models.audit_log import AuditLog
            log = db.query(AuditLog).filter(AuditLog.action_id == job_id).first()
            if log:
                state = "SUCCESS" if log.status == "SUCCESS" else "FAILURE" if log.status == "FAILED" else state
                error_message = log.error
        finally:
            db.close()

    info = result.info if isinstance(result.info, dict) else {}

    if result.failed() and not error_message:
        if isinstance(result.info, Exception):
            error_message = str(result.info)
        elif isinstance(result.result, Exception):
            error_message = str(result.result)
        else:
            error_message = str(result.info or result.result)

    return {
        "job_id": job_id,
        "state": state,
        "ready": result.ready() or state in ["SUCCESS", "FAILURE"],
        "successful": result.successful() if result.ready() else (state == "SUCCESS"),
        "retry_count": info.get("retry_count", 0),
        "trace_id": info.get("trace_id") or (job_id if state != "PENDING" else None),
        "post_id": info.get("post_id"),
        "error": error_message,
        "result": result.result if result.ready() and result.successful() else None,
    }
