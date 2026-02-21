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

    try:
        async for event in subscribe_events():
            await websocket.send_text(json.dumps(event))
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from /automation/ws/logs")
    except Exception as exc:
        logger.warning("Event stream unavailable, falling back to heartbeat: %s", exc)
        try:
            while True:
                await asyncio.sleep(5)
                fallback = {
                    "timestamp": datetime.now().isoformat(),
                    "level": "WARNING",
                    "message": "Event stream unavailable. Waiting for reconnection...",
                    "trace_id": None
                }
                await websocket.send_text(json.dumps(fallback))
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

    result = worker_celery.AsyncResult(job_id)
    info = result.info if isinstance(result.info, dict) else {}

    error_message = None
    if result.failed():
        if isinstance(result.info, Exception):
            error_message = str(result.info)
        elif isinstance(result.result, Exception):
            error_message = str(result.result)
        else:
            error_message = str(result.info or result.result)

    return {
        "job_id": job_id,
        "state": result.state,
        "ready": result.ready(),
        "successful": result.successful() if result.ready() else False,
        "retry_count": info.get("retry_count", 0),
        "trace_id": info.get("trace_id"),
        "post_id": info.get("post_id"),
        "error": error_message,
        "result": result.result if result.ready() and result.successful() else None,
    }
