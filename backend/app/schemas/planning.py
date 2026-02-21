from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PlanningRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=500)
    context: Dict[str, Any] = Field(default_factory=dict)
    max_steps: int = Field(default=5, ge=1, le=10)
    execute: bool = False


class PlannedTask(BaseModel):
    id: int
    title: str
    goal: str
    action_type: str
    context: Dict[str, Any] = Field(default_factory=dict)
    requires_human_approval: bool = False


class PlanExecutionItem(BaseModel):
    task_id: int
    task_title: str
    status: str
    job_id: Optional[str] = None
    error: Optional[str] = None


class PlanningResponse(BaseModel):
    goal: str
    summary: str
    source: str
    tasks: List[PlannedTask]
    trace_id: Optional[str] = None
    execution: Optional[List[PlanExecutionItem]] = None
