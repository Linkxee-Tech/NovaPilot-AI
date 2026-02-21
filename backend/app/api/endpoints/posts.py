from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api import crud, deps
from app.core.config import settings
from app.core.db import get_db
from app.schemas.post import Post, PostCreate, PostUpdate, Draft, DraftCreate, DraftUpdate
from app.models.user import User

from app.services.ai_service import ai_service
from app.services.nova.schemas import (
    OptimizedContent,
    HashtagResponse,
    EngagementPrediction,
    PostingTimeRecommendation,
    MultimodalOptimizedContent,
)
from fastapi import File, UploadFile
import os
import shutil
import uuid
from datetime import datetime

router = APIRouter()
# Service is used via ai_service singleton

UPLOAD_DIR = "uploads/posts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".mp4", ".mov", ".mp3", ".wav", ".pdf", ".docx", ".txt"}
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
BLOCKED_FILE_SIGNATURES = [
    b"MZ",       # Windows PE
    b"\x7fELF",  # Linux ELF
    b"#!",       # script shebang
]


def _build_media_metadata(file_path: str, original_name: str, content_type: str | None) -> Dict[str, Any]:
    extension = os.path.splitext(original_name)[1].lower()
    lower_type = (content_type or "").lower()
    if lower_type.startswith("image/") or extension in {".png", ".jpg", ".jpeg", ".gif"}:
        media_type = "image"
    elif lower_type.startswith("video/") or extension in {".mp4", ".mov"}:
        media_type = "video"
    elif lower_type.startswith("audio/") or extension in {".mp3", ".wav"}:
        media_type = "audio"
    elif lower_type.startswith("application/pdf") or extension == ".pdf":
        media_type = "document"
    elif extension in {".docx", ".txt"}:
        media_type = "document"
    else:
        media_type = "file"

    size_bytes = os.path.getsize(file_path)
    return {
        "filename": original_name,
        "content_type": content_type,
        "extension": extension,
        "media_type": media_type,
        "size_bytes": size_bytes,
        "size_kb": round(size_bytes / 1024, 2),
    }


def _validate_upload_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {allowed}",
        )

    # Basic size validation
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size <= 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds size limit of {MAX_UPLOAD_SIZE_MB}MB",
        )

    # Basic signature blocking against executable/script payloads.
    header = file.file.read(8)
    file.file.seek(0)
    if any(header.startswith(signature) for signature in BLOCKED_FILE_SIGNATURES):
        raise HTTPException(status_code=400, detail="Unsupported file signature")

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Upload media files (images, videos, etc.) for posts.
    Returns the relative URL of the uploaded file.
    """
    _validate_upload_file(file)
    file_ext = os.path.splitext(file.filename)[1].lower()

    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    metadata = _build_media_metadata(file_path, file.filename, file.content_type)

    # Return relative media URL and extracted metadata for multimodal workflows.
    return {"media_url": f"/uploads/posts/{file_name}", "metadata": metadata}

@router.post("/optimize/caption", response_model=OptimizedContent)
async def optimize_caption(
    caption: str = Body(..., embed=True),
    tone: str = Body(..., embed=True),
    target_audience: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Use Amazon Nova to optimize social media captions based on tone and audience.
    """
    return await ai_service.optimize_content(caption, tone, target_audience)


@router.post("/optimize/multimodal", response_model=MultimodalOptimizedContent)
async def optimize_multimodal_caption(
    caption: str = Body(..., embed=True),
    tone: str = Body("professional", embed=True),
    target_audience: str = Body("general", embed=True),
    media_context: Dict[str, Any] | None = Body(None, embed=True),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Optimize caption with additional media context.
    Accepts metadata from `/posts/upload` or a custom media context object.
    """
    return await ai_service.optimize_multimodal_content(
        caption,
        tone,
        target_audience,
        media_context=media_context or {},
    )

@router.post("/optimize/hashtags", response_model=HashtagResponse)
async def generate_hashtags(
    content: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_user)
):
    return await ai_service.get_hashtags(content)

@router.post("/optimize/engagement", response_model=EngagementPrediction)
async def predict_engagement(
    content: str = Body(..., embed=True),
    platform: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_user)
):
    return await ai_service.predict_engagement(content, platform)

@router.post("/optimize/schedule", response_model=PostingTimeRecommendation)
async def recommend_schedule(
    content: str = Body(..., embed=True),
    platform: str = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_user)
):
    return await ai_service.get_scheduling_recommendation(content, platform)

@router.get("/posts", response_model=List[Post])
def read_posts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Retrieve the current user's posts with pagination.
    """
    posts = crud.get_posts(db, skip=skip, limit=limit, user_id=current_user.id)
    return posts

@router.get("/posts/{post_id}", response_model=Post)
def read_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(deps.get_current_active_user)):
    post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/posts", response_model=Post)
def create_post(
    post: PostCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Validate content length for platform
    from app.core.validation import validate_content_length
    validate_content_length(post.content, post.platform)
    
    return crud.create_post(db=db, post=post, user_id=current_user.id)



@router.patch("/posts/{post_id}", response_model=Post)
def update_post(
    post_id: int, 
    post_in: PostUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    post = crud.update_post(db, post_id=post_id, post_in=post_in, user_id=current_user.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    post = crud.delete_post(db, post_id=post_id, user_id=current_user.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success"}

@router.post("/posts/{post_id}/schedule")
def schedule_post(
    post_id: int, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    
    # Update status to scheduled
    crud.update_post(
        db,
        post_id=post_id,
        post_in=PostUpdate(status="scheduled"),
        user_id=current_user.id
    )

    if settings.DEMO_MODE:
        crud.update_post(
            db,
            post_id=post_id,
            post_in=PostUpdate(status="running"),
            user_id=current_user.id
        )
        crud.update_post(
            db,
            post_id=post_id,
            post_in=PostUpdate(status="published", published_at=datetime.utcnow()),
            user_id=current_user.id
        )
        try:
            from app.api import crud_audit
            from app.schemas.analytics import AuditLogCreate

            crud_audit.create_audit_log(
                db,
                AuditLogCreate(
                    trace_id=trace_id,
                    action="publish_post_demo",
                    status="SUCCESS",
                    platform=post.platform.value if hasattr(post.platform, "value") else str(post.platform),
                    user=current_user.email,
                    details={
                        "post_id": post_id,
                        "mode": "demo",
                    },
                ),
            )
        except Exception:
            # Do not fail scheduling flow if audit logging fails in demo mode.
            pass
        return {
            "status": "completed_demo",
            "message": "Post published successfully in demo mode",
            "trace_id": trace_id,
            "job_id": f"demo-post-{uuid.uuid4().hex[:10]}"
        }

    from app.tasks.worker import execute_post_publication

    try:
        task = execute_post_publication.delay(post_id, trace_id=trace_id)
        return {
            "status": "scheduled",
            "message": "Post queued for publishing",
            "trace_id": trace_id,
            "job_id": str(task.id)
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to enqueue job: {exc}")


@router.get("/drafts", response_model=List[Draft])
def read_drafts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    drafts = crud.get_drafts(db, skip=skip, limit=limit, user_id=current_user.id)
    return drafts

@router.post("/drafts", response_model=Draft)
def create_draft(
    draft: DraftCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return crud.create_draft(db=db, draft=draft, user_id=current_user.id)


@router.patch("/drafts/{draft_id}", response_model=Draft)
def update_draft(
    draft_id: int,
    draft_in: DraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    draft = crud.update_draft(db, draft_id=draft_id, draft_in=draft_in, user_id=current_user.id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@router.delete("/drafts/{draft_id}")
def delete_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    draft = crud.delete_draft(db, draft_id=draft_id, user_id=current_user.id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"status": "success"}
