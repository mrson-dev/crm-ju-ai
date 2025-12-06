from functools import wraps
from typing import Callable, Any, Optional
from datetime import timedelta
from fastapi import Request
from app.core.redis_cache import redis_cache, cache_key
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def cached(
    ttl: Optional[int] = None,
    key_prefix: str = "",
    include_user: bool = False
):
    """
    Decorator para cachear resultados de funções assíncronas.
    
    Args:
        ttl: Tempo de vida do cache em segundos (padrão: settings.REDIS_DEFAULT_TTL)
        key_prefix: Prefixo para a chave do cache
        include_user: Se True, inclui o ID do usuário na chave do cache
    
    Exemplo:
        @cached(ttl=300, key_prefix="user", include_user=True)
        async def get_user_profile(user_id: int):
            return await db.query(User).filter(User.id == user_id).first()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            if not redis_cache.is_connected:
                return await func(*args, **kwargs)
            
            # Construir chave do cache
            key_parts = [key_prefix or func.__name__]
            
            # Adicionar argumentos à chave
            for arg in args:
                if isinstance(arg, (str, int, float, bool)):
                    key_parts.append(str(arg))
            
            # Adicionar kwargs à chave
            for k, v in sorted(kwargs.items()):
                if isinstance(v, (str, int, float, bool)):
                    key_parts.append(f"{k}:{v}")
            
            # Adicionar user_id se necessário
            if include_user:
                request = kwargs.get("request")
                if request and hasattr(request.state, "user"):
                    key_parts.append(f"user:{request.state.user.id}")
            
            cache_key_str = cache_key(*key_parts)
            
            # Tentar obter do cache
            cached_value = await redis_cache.get(cache_key_str)
            if cached_value is not None:
                logger.debug(f"Cache hit for {cache_key_str}")
                return cached_value
            
            # Executar função e cachear resultado
            result = await func(*args, **kwargs)
            
            cache_ttl = ttl or settings.REDIS_DEFAULT_TTL
            await redis_cache.set(cache_key_str, result, ttl=cache_ttl)
            logger.debug(f"Cached result for {cache_key_str} (TTL: {cache_ttl}s)")
            
            return result
        
        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalida todas as chaves de cache que correspondem ao padrão.
    
    Args:
        pattern: Padrão de chave (ex: "user:*", "process:123:*")
    
    Returns:
        Número de chaves deletadas
    """
    if not redis_cache.is_connected:
        return 0
    
    deleted = await redis_cache.delete_pattern(pattern)
    logger.info(f"Invalidated {deleted} cache keys matching pattern: {pattern}")
    return deleted


async def invalidate_user_cache(user_id: int) -> int:
    """
    Invalida todo o cache relacionado a um usuário específico.
    """
    return await invalidate_cache_pattern(f"*user:{user_id}*")


async def invalidate_resource_cache(resource_type: str, resource_id: int) -> int:
    """
    Invalida todo o cache relacionado a um recurso específico.
    
    Args:
        resource_type: Tipo do recurso (ex: "process", "client", "document")
        resource_id: ID do recurso
    """
    return await invalidate_cache_pattern(f"{resource_type}:{resource_id}:*")
