from __future__ import annotations

from collections.abc import Callable
from threading import Lock
from time import time

from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from app.core.cache import get_redis_client

_memory_buckets: dict[str, tuple[int, float]] = {}
_memory_lock = Lock()
_cleanup_counter = 0
_cleanup_interval = 100


def _get_identifier(request: Request) -> str:
    return request.client.host if request.client else "anonymous"


def _enforce_memory_limit(key: str, *, limit: int, window_seconds: int) -> None:
    global _cleanup_counter
    now = time()
    with _memory_lock:
        _cleanup_counter += 1
        if _cleanup_counter >= _cleanup_interval:
            _cleanup_counter = 0
            expired_keys = [
                bucket_key
                for bucket_key, (_, expires_at) in _memory_buckets.items()
                if now >= expires_at
            ]
            for bucket_key in expired_keys:
                _memory_buckets.pop(bucket_key, None)
        count, expires_at = _memory_buckets.get(key, (0, now + window_seconds))
        if now >= expires_at:
            count, expires_at = 0, now + window_seconds
        count += 1
        _memory_buckets[key] = (count, expires_at)
    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests, please try again later",
        )


def rate_limit_dependency(
    key_prefix: str, *, limit: int, window_seconds: int
) -> Callable[[Request], None]:
    def _dependency(request: Request) -> None:
        identifier = _get_identifier(request)
        bucket = int(time() // window_seconds)
        key = f"ratelimit:{key_prefix}:{identifier}:{bucket}"
        redis_client = get_redis_client()

        if redis_client is None:
            _enforce_memory_limit(key, limit=limit, window_seconds=window_seconds)
            return

        try:
            current = int(redis_client.incr(key))
            if current == 1:
                redis_client.expire(key, window_seconds)
        except RedisError:
            _enforce_memory_limit(key, limit=limit, window_seconds=window_seconds)
            return

        if current > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later",
            )

    return _dependency
