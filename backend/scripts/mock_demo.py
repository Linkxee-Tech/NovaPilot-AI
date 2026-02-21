"""
Mock demo runner for NovaPilot AI.

Purpose:
- Exercise key user flows against a running backend without Bedrock/platform dependencies.
- Produce a machine-readable report for quick pre-delivery verification.

Usage:
    python scripts/mock_demo.py

Environment variables:
    MOCK_DEMO_BASE_URL      default: http://localhost:8000/api/v1
    MOCK_DEMO_EMAIL         default: demo.user@novapilot.ai
    MOCK_DEMO_PASSWORD      default: DemoPass123!
    MOCK_DEMO_OUTPUT_DIR    default: mock_demo_output
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests


BASE_URL = os.getenv("MOCK_DEMO_BASE_URL", "http://localhost:8000/api/v1").rstrip("/")
DEMO_EMAIL = os.getenv("MOCK_DEMO_EMAIL", "demo.user@novapilot.ai")
DEMO_PASSWORD = os.getenv("MOCK_DEMO_PASSWORD", "DemoPass123!")
OUTPUT_DIR = Path(os.getenv("MOCK_DEMO_OUTPUT_DIR", "mock_demo_output"))


@dataclass
class StepResult:
    step: str
    ok: bool
    status_code: int | None
    details: str


def _print(message: str) -> None:
    print(message, flush=True)


def call_api(
    session: requests.Session,
    method: str,
    path: str,
    *,
    data: Any | None = None,
    json_body: Any | None = None,
    files: Any | None = None,
    expected: set[int] | None = None,
) -> tuple[bool, requests.Response, Any]:
    expected = expected or {200}
    url = f"{BASE_URL}{path}"
    try:
        response = session.request(
            method=method,
            url=url,
            data=data,
            json=json_body,
            files=files,
            timeout=30,
        )
    except requests.RequestException as exc:
        fallback = requests.Response()
        fallback.status_code = 0
        fallback._content = str(exc).encode("utf-8")
        return False, fallback, {"error": str(exc)}
    try:
        payload = response.json()
    except Exception:
        payload = response.text
    return response.status_code in expected, response, payload


def run() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    results: list[StepResult] = []

    def record(step: str, ok: bool, status: int | None, details: str) -> None:
        results.append(StepResult(step=step, ok=ok, status_code=status, details=details))
        marker = "PASS" if ok else "FAIL"
        _print(f"[{marker}] {step} - {details}")

    _print(f"Running mock demo against {BASE_URL}")

    # 1) Health check
    ok, resp, payload = call_api(session, "GET", "/health", expected={200})
    status = payload.get("status") if isinstance(payload, dict) else "unknown"
    record("Health Check", ok, resp.status_code, f"status={status}")
    if not ok:
        _write_report(results)
        return 1

    # 2) Register demo user (idempotent)
    ok, resp, payload = call_api(
        session,
        "POST",
        "/auth/register",
        json_body={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
            "full_name": "Mock Demo User",
        },
        expected={200, 400},
    )
    if resp.status_code == 400 and isinstance(payload, dict) and "already exists" in str(payload.get("detail", "")).lower():
        record("Register Demo User", True, resp.status_code, "user already exists")
    else:
        record("Register Demo User", ok, resp.status_code, "created new demo user")

    # 3) Login
    ok, resp, payload = call_api(
        session,
        "POST",
        "/auth/login",
        data={"username": DEMO_EMAIL, "password": DEMO_PASSWORD},
        expected={200},
    )
    access_token = payload.get("access_token") if isinstance(payload, dict) else None
    if access_token:
        session.headers["Authorization"] = f"Bearer {access_token}"
    record("Login", ok and bool(access_token), resp.status_code, "access token acquired" if access_token else "missing token")
    if not access_token:
        _write_report(results)
        return 1

    # 4) Verify session
    ok, resp, payload = call_api(session, "GET", "/auth/me", expected={200})
    user_email = payload.get("email") if isinstance(payload, dict) else None
    record("Get Current User", ok and user_email == DEMO_EMAIL, resp.status_code, f"email={user_email}")

    # 5) Connect platform credential (demo safe)
    ok, resp, payload = call_api(
        session,
        "POST",
        "/platforms/",
        json_body={
            "name": "linkedin",
            "username": "demo_linkedin_user",
            "password": "demo_linkedin_password",
        },
        expected={200},
    )
    platform_id = payload.get("id") if isinstance(payload, dict) else None
    record("Connect Platform", ok and bool(platform_id), resp.status_code, f"platform_id={platform_id}")

    # 6) Create draft
    draft_content = "Launching our reliability update for NovaPilot this week."
    ok, resp, payload = call_api(
        session,
        "POST",
        "/posts/drafts",
        json_body={
            "content": draft_content,
            "platform": "linkedin",
        },
        expected={200},
    )
    draft_id = payload.get("id") if isinstance(payload, dict) else None
    record("Create Draft", ok and bool(draft_id), resp.status_code, f"draft_id={draft_id}")

    # 7) Optimize caption (works in DEMO_MODE)
    ok, resp, payload = call_api(
        session,
        "POST",
        "/posts/optimize/caption",
        json_body={
            "caption": draft_content,
            "tone": "professional",
            "target_audience": "technical founders",
        },
        expected={200},
    )
    optimized_caption = payload.get("optimized_caption") if isinstance(payload, dict) else None
    record("Optimize Caption", ok and bool(optimized_caption), resp.status_code, "caption optimized")

    # 8) Create post
    schedule_time = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    post_body = {
        "content": optimized_caption or draft_content,
        "platform": "linkedin",
        "scheduled_at": schedule_time,
    }
    ok, resp, payload = call_api(session, "POST", "/posts/posts", json_body=post_body, expected={200})
    post_id = payload.get("id") if isinstance(payload, dict) else None
    record("Create Post", ok and bool(post_id), resp.status_code, f"post_id={post_id}")

    # 9) Schedule/publish post
    job_id = None
    if post_id:
        ok, resp, payload = call_api(session, "POST", f"/posts/posts/{post_id}/schedule", expected={200})
        job_id = payload.get("job_id") if isinstance(payload, dict) else None
        record("Schedule Post", ok and bool(job_id), resp.status_code, f"job_id={job_id}")
    else:
        record("Schedule Post", False, None, "post_id missing from previous step")

    # 10) Plan execution
    ok, resp, payload = call_api(
        session,
        "POST",
        "/automation/plan",
        json_body={
            "goal": "Generate, optimize, schedule, and monitor a LinkedIn launch post",
            "context": {"campaign": "mock_demo"},
            "max_steps": 5,
            "execute": True,
        },
        expected={200},
    )
    plan_tasks = len(payload.get("tasks", [])) if isinstance(payload, dict) else 0
    record("Generate Automation Plan", ok and plan_tasks > 0, resp.status_code, f"tasks={plan_tasks}")

    # 11) Check job status (for schedule job)
    if job_id:
        ok, resp, payload = call_api(session, "GET", f"/automation/jobs/{job_id}", expected={200})
        state = payload.get("state") if isinstance(payload, dict) else "unknown"
        record("Check Job Status", ok, resp.status_code, f"state={state}")
    else:
        record("Check Job Status", False, None, "job_id missing from previous step")

    # 12) Pull analytics for the created post
    if post_id:
        ok, resp, payload = call_api(session, "GET", f"/analytics/{post_id}", expected={200})
        impressions = payload.get("impressions") if isinstance(payload, dict) else None
        record("Get Post Analytics", ok, resp.status_code, f"impressions={impressions}")
    else:
        record("Get Post Analytics", False, None, "post_id missing from previous step")

    # 13) Export analytics CSV
    ok, resp, payload = call_api(session, "GET", "/analytics/export/csv", expected={200})
    csv_path = OUTPUT_DIR / "analytics_export.csv"
    if ok:
        csv_path.write_bytes(resp.content)
    record("Export Analytics CSV", ok and csv_path.exists(), resp.status_code, f"saved={csv_path}")

    # 14) Read audit logs
    ok, resp, payload = call_api(session, "GET", "/audit/", expected={200})
    log_count = len(payload) if isinstance(payload, list) else 0
    record("Read Audit Logs", ok, resp.status_code, f"count={log_count}")

    _write_report(results)
    failed = sum(1 for item in results if not item.ok)
    _print(f"Mock demo completed: {len(results) - failed} passed, {failed} failed")
    return 0 if failed == 0 else 1


def _write_report(results: list[StepResult]) -> None:
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "base_url": BASE_URL,
        "demo_email": DEMO_EMAIL,
        "summary": {
            "total_steps": len(results),
            "passed": sum(1 for item in results if item.ok),
            "failed": sum(1 for item in results if not item.ok),
        },
        "results": [asdict(item) for item in results],
    }
    report_path = OUTPUT_DIR / "mock_demo_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    _print(f"Report written to {report_path}")


if __name__ == "__main__":
    raise SystemExit(run())
