"""
Middleware customizado para logging, métricas e rate limiting.
"""

import time
import logging
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
from collections import defaultdict
from datetime import datetime, timedelta
from app.core.audit_logger import request_id_var, user_id_var

logger = logging.getLogger(__name__)


class AuditContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware para adicionar request_id e user_id ao contexto de auditoria.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)

        try:
            user = getattr(request.state, "user", None)
            if user and isinstance(user, dict):
                user_id_var.set(user.get("user_id"))
        except:
            pass

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logging de todas as requisições.
    Registra método, path, tempo de resposta e status code.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        logger.info(f"→ {request.method} {request.url.path}")

        try:
            response = await call_next(request)

            process_time = time.time() - start_time

            response.headers["X-Process-Time"] = str(process_time)

            log_level = logging.INFO if response.status_code < 400 else logging.WARNING
            logger.log(
                log_level,
                f"← {request.method} {request.url.path} "
                f"[{response.status_code}] {process_time:.3f}s"
            )

            return response

        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"✗ {request.method} {request.url.path} "
                f"[ERROR] {process_time:.3f}s - {str(e)}"
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware para rate limiting simples baseado em IP.
    Limita número de requisições por minuto.
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
    
    def _clean_old_requests(self, ip: str):
        """Remove requisições antigas (mais de 1 minuto)"""
        cutoff = datetime.now() - timedelta(minutes=1)
        self.requests[ip] = [
            req_time for req_time in self.requests[ip]
            if req_time > cutoff
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"

        self._clean_old_requests(client_ip)

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )

        self.requests[client_ip].append(datetime.now())

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware para adicionar headers de segurança.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """
    Middleware que bypassa outros middlewares para /health endpoint.
    Garante que health checks sejam sempre rápidos.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Se é health check, processa diretamente
        if request.url.path in ["/health", "/api/v1/health"]:
            return await call_next(request)
        
        # Caso contrário, continua normalmente
        return await call_next(request)
