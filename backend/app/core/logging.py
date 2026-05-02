import structlog
import uuid
import time
import logging
import sys
from typing import Any, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

def setup_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        correlation_id = str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        
        start_time = time.perf_counter()
        
        # Attach user if possible (requires auth middleware to have run, 
        # but BaseHTTPMiddleware runs after auth if placed correctly, 
        # however many FastAPI apps access user via dependencies.
        # We'll check for state or session if exists)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
             structlog.contextvars.bind_contextvars(user_id=user_id)

        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger = structlog.get_logger()
            logger.exception(
                "http_request_failed",
                method=request.method,
                path=request.url.path,
                duration=f"{process_time:.4f}s",
                error=str(e)
            )
            raise e from None
        
        process_time = time.perf_counter() - start_time
        
        logger = structlog.get_logger()
        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=f"{process_time:.4f}s",
        )
        
        response.headers["X-Correlation-ID"] = correlation_id
        return response
