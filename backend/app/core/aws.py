import logging
from typing import Any, Dict

import boto3

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_session_kwargs() -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {}

    if settings.AWS_REGION:
        kwargs["region_name"] = settings.AWS_REGION

    if settings.AWS_PROFILE:
        kwargs["profile_name"] = settings.AWS_PROFILE
        return kwargs

    has_access_key = bool(settings.AWS_ACCESS_KEY_ID)
    has_secret_key = bool(settings.AWS_SECRET_ACCESS_KEY)

    if has_access_key and has_secret_key:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    elif has_access_key or has_secret_key:
        logger.warning(
            "Partial AWS static credentials detected. Falling back to default AWS credential chain."
        )

    return kwargs


def get_boto3_session() -> boto3.Session:
    return boto3.Session(**_build_session_kwargs())


def get_aws_client(service_name: str):
    session = get_boto3_session()
    return session.client(service_name)
