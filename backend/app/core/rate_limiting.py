"""
Middleware de rate limiting para proteger endpoints críticos.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    Rate limiter simples baseado em memória.
    Para produção, usar Redis com bibliotecas como slowapi.
    """
    
    def __init__(self):
        # {client_id: [(timestamp, count)]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def is_allowed(
        self, 
        client_id: str, 
        max_requests: int, 
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Verifica se o cliente pode fazer a requisição.
        
        Returns:
            Tuple[bool, int]: (allowed, remaining_requests)
        """
        async with self.lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=window_seconds)
            
            # Limpar requisições antigas
            self.requests[client_id] = [
                req for req in self.requests[client_id]
                if req > window_start
            ]
            
            # Verificar limite
            current_count = len(self.requests[client_id])
            
            if current_count >= max_requests:
                return False, 0
            
            # Adicionar nova requisição
            self.requests[client_id].append(now)
            remaining = max_requests - current_count - 1
            
            return True, remaining
    
    async def cleanup_old_entries(self, max_age_seconds: int = 3600):
        """Remove entradas antigas da memória."""
        async with self.lock:
            cutoff = datetime.now() - timedelta(seconds=max_age_seconds)
            
            for client_id in list(self.requests.keys()):
                self.requests[client_id] = [
                    req for req in self.requests[client_id]
                    if req > cutoff
                ]
                
                # Remove cliente se não tiver mais requisições
                if not self.requests[client_id]:
                    del self.requests[client_id]


# Instância global
rate_limiter = RateLimiter()


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para aplicar rate limiting em endpoints específicos.
    """
    
    # Configurações por endpoint
    RATE_LIMITS = {
        "/api/auth/login": (5, 60),  # 5 requisições por minuto
        "/api/auth/register": (3, 3600),  # 3 por hora
        "/api/documents/upload": (10, 60),  # 10 por minuto
        "/api/clients/": (30, 60),  # 30 por minuto (POST)
        "/api/cases/": (30, 60),  # 30 por minuto (POST)
    }
    
    # Rate limit padrão para outros endpoints
    DEFAULT_RATE_LIMIT = (100, 60)  # 100 por minuto
    
    async def dispatch(self, request: Request, call_next):
        # Ignorar rate limiting para health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Identificar cliente (IP ou user_id)
        client_id = self._get_client_id(request)
        
        # Obter configuração de rate limit
        path = request.url.path
        max_requests, window_seconds = self._get_rate_limit(path, request.method)
        
        # Verificar rate limit
        allowed, remaining = await rate_limiter.is_allowed(
            client_id, max_requests, window_seconds
        )
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Try again in {window_seconds} seconds.",
                    "retry_after": window_seconds
                }
            )
        
        # Processar requisição
        response = await call_next(request)
        
        # Adicionar headers de rate limit
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(window_seconds)
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """
        Identifica o cliente baseado em user_id (autenticado) ou IP.
        """
        # Se autenticado, usar user_id
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        
        # Senão, usar IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        return f"ip:{ip}"
    
    def _get_rate_limit(self, path: str, method: str) -> Tuple[int, int]:
        """
        Retorna (max_requests, window_seconds) para o endpoint.
        """
        # Endpoints com rate limit específico
        for endpoint, (max_req, window) in self.RATE_LIMITS.items():
            if path.startswith(endpoint):
                return max_req, window
        
        # Rate limit padrão
        return self.DEFAULT_RATE_LIMIT


async def cleanup_task():
    """Task periódica para limpar entradas antigas do rate limiter."""
    while True:
        await asyncio.sleep(3600)  # A cada hora
        await rate_limiter.cleanup_old_entries()
