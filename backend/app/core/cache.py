"""
Utilidades para cache e otimização de queries.
"""

from typing import Optional, Callable, TypeVar, Generic
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class SimpleCache(Generic[T]):
    """
    Cache simples em memória com TTL.
    Para produção, considere usar Redis.
    """
    
    def __init__(self, ttl_seconds: int = 300):
        self.cache = {}
        self.ttl_seconds = ttl_seconds
    
    def _is_expired(self, timestamp: datetime) -> bool:
        """Verifica se o cache expirou"""
        return datetime.now() - timestamp > timedelta(seconds=self.ttl_seconds)
    
    def get(self, key: str) -> Optional[T]:
        """Busca valor no cache"""
        if key not in self.cache:
            return None
        
        value, timestamp = self.cache[key]
        
        if self._is_expired(timestamp):
            del self.cache[key]
            return None
        
        logger.debug(f"Cache hit: {key}")
        return value
    
    def set(self, key: str, value: T) -> None:
        """Armazena valor no cache"""
        self.cache[key] = (value, datetime.now())
        logger.debug(f"Cache set: {key}")
    
    def delete(self, key: str) -> None:
        """Remove valor do cache"""
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Cache deleted: {key}")
    
    def clear(self) -> None:
        """Limpa todo o cache"""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def cleanup(self) -> None:
        """Remove itens expirados"""
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if self._is_expired(timestamp)
        ]
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.info(f"Cleaned {len(expired_keys)} expired cache entries")


def cache_key(*args, **kwargs) -> str:
    """
    Gera chave de cache baseada em argumentos.
    """
    key_data = {
        "args": args,
        "kwargs": sorted(kwargs.items())
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(ttl: int = 300):
    """
    Decorator para cachear resultados de funções.
    
    Usage:
        @cached(ttl=600)
        async def get_expensive_data(user_id: str):
            # ... operação custosa
            return data
    """
    cache = SimpleCache(ttl_seconds=ttl)
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Gera chave do cache
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Tenta buscar no cache
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result
            
            # Executa função e armazena no cache
            result = await func(*args, **kwargs)
            cache.set(key, result)
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result
            
            result = func(*args, **kwargs)
            cache.set(key, result)
            
            return result
        
        # Retorna wrapper apropriado baseado se função é async
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Cache global para uso em toda aplicação
app_cache = SimpleCache(ttl_seconds=300)


def invalidate_cache_pattern(pattern: str) -> None:
    """
    Invalida todas as chaves de cache que correspondem ao padrão.
    
    Usage:
        invalidate_cache_pattern("user:123:")  # Invalida tudo do user 123
    """
    keys_to_delete = [
        key for key in app_cache.cache.keys()
        if pattern in key
    ]
    for key in keys_to_delete:
        app_cache.delete(key)
    
    logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching '{pattern}'")
