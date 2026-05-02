from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings


@lru_cache
def get_redis_client() -> Redis | None:
    if not settings.REDIS_URL:
        return None
    try:
        return Redis.from_url(settings.REDIS_URL, decode_responses=True)
    except RedisError:
        return None


def get_str(key: str) -> str | None:
    """Return a raw string value from Redis, or None if missing / Redis unavailable."""
    client = get_redis_client()
    if client is None:
        return None
    try:
        return client.get(key)  # type: ignore[return-value]
    except RedisError:
        return None


def set_str(key: str, value: str, ttl_seconds: int) -> None:
    """Store a raw string in Redis with an explicit TTL (seconds)."""
    client = get_redis_client()
    if client is None:
        return
    try:
        client.setex(key, ttl_seconds, value)
    except RedisError:
        return


def delete_key(key: str) -> None:
    """Delete a key from Redis, ignoring errors."""
    client = get_redis_client()
    if client is None:
        return
    try:
        client.delete(key)
    except RedisError:
        return


def get_cached_json(key: str) -> Any | None:
    client = get_redis_client()
    if client is None:
        return None
    try:
        value = client.get(key)
        if value is None:
            return None
        return json.loads(value)
    except (RedisError, json.JSONDecodeError):
        return None


def set_cached_json(key: str, payload: Any, ttl_seconds: int | None = None) -> None:
    client = get_redis_client()
    if client is None:
        return
    ttl = ttl_seconds if ttl_seconds is not None else settings.REDIS_CACHE_TTL_SECONDS
    try:
        client.setex(key, ttl, json.dumps(payload, default=str))
    except RedisError:
        return


def invalidate_cache_prefix(prefix: str) -> None:
    client = get_redis_client()
    if client is None:
        return
    try:
        for key in client.scan_iter(match=f"{prefix}*"):
            client.delete(key)
    except RedisError:
        return
