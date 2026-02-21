import hashlib
import json
import logging
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from datetime import datetime
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def generate_hash(payload: Dict) -> str:
        """
        Generates SHA-256 hash of the payload for immutability check.
        """
        try:
            payload_str = json.dumps(payload, sort_keys=True)
            return hashlib.sha256(payload_str.encode()).hexdigest()
        except Exception as e:
            logger.error(f"Hash generation failed: {e}")
            return "hash_error"

    @staticmethod
    def create_audit_log(
        db: Session,
        action_id: str,
        goal: str,
        payload: Dict,
        user_id: Optional[str] = None,
        platform: Optional[str] = None
    ) -> AuditLog:
        payload_hash = AuditService.generate_hash(payload)

        db_log = AuditLog(
            trace_id=action_id,
            action=goal,
            user=user_id,
            platform=platform,
            details=payload,
            evidence_hash=payload_hash,
            status="pending"
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def update_audit_log(
        db: Session,
        log_id: int,
        status: str,
        result: Optional[Dict] = None,
        error: Optional[str] = None,
        error_code: Optional[str] = None
    ):
        log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
        if log:
            log.status = status
            details = log.details or {}
            if result is not None:
                details["result"] = result
            if error is not None:
                details["error"] = error
            if error_code is not None:
                details["error_code"] = error_code
            details["updated_at"] = datetime.utcnow().isoformat()
            log.details = details
            db.commit()
            db.refresh(log)
            return log
        return None
