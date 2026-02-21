from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import crud_audit, deps
from app.core.db import get_db
from app.schemas.analytics import AuditLog
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[AuditLog])
def read_audit_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Optional: restricts to admins only
    # deps.RoleChecker(["admin"])(current_user)
    return crud_audit.get_audit_logs(db, skip=skip, limit=limit)

@router.get("/{audit_id}", response_model=AuditLog)
def read_audit_log(
    audit_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    audit = crud_audit.get_audit_log(db, audit_id=audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return audit
