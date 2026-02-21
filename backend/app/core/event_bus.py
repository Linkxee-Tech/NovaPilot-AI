import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

import redis
import redis.asyncio as redis_async

from app.core.config import settings

logger = logging.getLogger(__name__)

AUTOMATION_EVENTS_CHANNEL = "automation.events"


def _with_defaults(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(event)
    payload.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    payload.setdefault("level", "INFO")
    payload.setdefault("message", "")
    payload.setdefault("trace_id", None)
    return payload


def publish_event(event: Dict[str, Any], channel: str = AUTOMATION_EVENTS_CHANNEL) -> bool:
    """
    Publish a worker or API event to Redis pub/sub.
    Returns False when Redis is unavailable so callers can continue gracefully.
    """
    payload = _with_defaults(event)
    client: Optional[redis.Redis] = None
    try:
        client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        client.publish(channel, json.dumps(payload, default=str))
        return True
    except Exception as exc:
        logger.debug("Failed to publish event to Redis: %s", exc)
        return False
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass


async def subscribe_events(channel: str = AUTOMATION_EVENTS_CHANNEL) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Subscribe to automation events from Redis and yield parsed event payloads.
    """
    client = redis_async.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = client.pubsub()
    await pubsub.subscribe(channel)
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message.get("type") == "message":
                raw = message.get("data")
                try:
                    data = json.loads(raw)
                except Exception:
                    data = {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "level": "ERROR",
                        "message": "Received malformed event payload",
                        "trace_id": None,
                    }
                yield _with_defaults(data)
            await asyncio.sleep(0.1)
    finally:
        try:
            await pubsub.unsubscribe(channel)
        finally:
            await pubsub.close()
            await client.close()
