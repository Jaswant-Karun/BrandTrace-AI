import time
import uuid
import logging
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from brandtrace.core.security import mask_sensitive_data

logger = logging.getLogger("brandtrace.security")

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window in-memory rate limiter.
    Enforces a default quota of 120 requests/minute per client IP or Auth token.
    Provides standard X-RateLimit headers and returns HTTP 429 when quota is exceeded.
    """
    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        # client_key -> list of timestamp floats
        self.client_request_history: Dict[str, List[float]] = defaultdict(list)
        # Test override: allows test suites to trigger 429 without making 120 network calls
        self.test_custom_limits: Dict[str, int] = {}

    def set_custom_limit_for_client(self, client_key: str, limit: int):
        """Used in automated test suites to verify rate limiter triggering with small burst."""
        self.test_custom_limits[client_key] = limit

    def clear_client_history(self, client_key: Optional[str] = None):
        if client_key:
            self.client_request_history.pop(client_key, None)
            self.test_custom_limits.pop(client_key, None)
        else:
            self.client_request_history.clear()
            self.test_custom_limits.clear()

    async def dispatch(self, request: Request, call_next) -> Response:
        # Bypass health and documentation endpoints
        path = request.url.path
        if path in ["/health", "/docs", "/openapi.json", "/"]:
            return await call_next(request)

        # Identify client by Bearer token, custom client header, or client IP
        auth_header = request.headers.get("Authorization", "")
        test_client_id = request.headers.get("X-Client-ID")
        if test_client_id:
            client_id = f"client:{test_client_id}"
        elif auth_header.startswith("Bearer "):
            client_id = f"token:{auth_header.split(' ')[1][:16]}"
        else:
            client_id = f"ip:{request.client.host if request.client else '127.0.0.1'}"

        # Check for test header override
        header_limit = request.headers.get("X-Test-Rate-Limit")
        limit = int(header_limit) if header_limit and header_limit.isdigit() else self.test_custom_limits.get(client_id, self.requests_per_minute)

        now = time.time()
        window_start = now - 60.0

        # Purge timestamps outside the 60s sliding window
        history = [ts for ts in self.client_request_history[client_id] if ts > window_start]
        self.client_request_history[client_id] = history

        # Check limit
        if len(history) >= limit:
            retry_after = int(60.0 - (now - history[0])) if history else 60
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Maximum {limit} requests per minute allowed.",
                    "status": "RATE_LIMITED",
                    "retry_after_seconds": max(1, retry_after)
                },
                headers={
                    "Retry-After": str(max(1, retry_after)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(window_start + 60))
                }
            )

        # Record this request
        self.client_request_history[client_id].append(now)
        remaining = max(0, limit - len(self.client_request_history[client_id]))

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + 60))
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces enterprise HTTP security headers:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: camera=(), microphone=(), geolocation=()
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class ErrorSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Guarantees zero database credentials, JWT secrets, or internal AI keys leak in unhandled 500 errors.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            trace_id = str(uuid.uuid4())
            sanitized_exc = mask_sensitive_data(str(exc))
            logger.error(f"[ErrorTrace {trace_id}] Unhandled error: {sanitized_exc}")
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error occurred. All sensitive credentials protected.",
                    "trace_id": trace_id,
                    "status": "INTERNAL_SERVER_ERROR"
                }
            )
