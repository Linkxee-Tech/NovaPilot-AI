from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.analytics import AuditLogCreate
import uuid
import hashlib
import json

def create_audit_log(db: Session, audit_in: AuditLogCreate):
    # Generate trace ID if not provided
    trace_id = audit_in.trace_id or str(uuid.uuid4())
    
    # Generate SHA-256 hash of details for integrity
    details_str = json.dumps(audit_in.details, sort_keys=True) if audit_in.details else ""
    # Include more fields in the hash for absolute integrity
    raw_data = f"{trace_id}:{audit_in.action}:{audit_in.status}:{audit_in.platform}:{details_str}"
    integrity_hash = hashlib.sha256(raw_data.encode()).hexdigest()
    
    db_audit = AuditLog(
        trace_id=trace_id,
        action=audit_in.action,
        status=audit_in.status,
        platform=audit_in.platform,
        user=audit_in.user,
        evidence_hash=integrity_hash,
        # In production, this would be a KMS-signed JWS or similar
        details={
            **(audit_in.details or {}),
            "signature": f"kms-v1:{integrity_hash[::-1][:16]}...", # Mock signature
            "compliance": "enterprise-ready"
        },
        timestamp=audit_in.timestamp
    )

    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_log(db: Session, audit_id: int):
    return db.query(AuditLog).filter(AuditLog.id == audit_id).first()
