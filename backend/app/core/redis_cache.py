import logging
import json
from typing import Any, Optional, Union
from datetime import timedelta
import redis.asyncio as redis
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self):
        self._redis: Optional[Redis] = None
        self._enabled = settings.REDIS_ENABLED

    async def connect(self):
        if not self._enabled:
            logger.info("Redis cache is disabled")
            return

        try:
            self._redis = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=settings.REDIS_CONNECT_TIMEOUT,
            )
            await self._redis.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._enabled = False
            self._redis = None

    async def disconnect(self):
        if self._redis:
            await self._redis.close()
            logger.info("Redis cache disconnected")

    async def get(self, key: str) -> Optional[Any]:
        if not self._enabled or not self._redis:
            return None

        try:
            value = await self._redis.get(key)
            if value:
                logger.debug(f"Cache hit: {key}")
                return json.loads(value)
            logger.debug(f"Cache miss: {key}")
            return None
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[Union[int, timedelta]] = None
    ) -> bool:
        if not self._enabled or not self._redis:
            return False

        try:
            serialized = json.dumps(value, default=str)
            if ttl:
                if isinstance(ttl, timedelta):
                    ttl = int(ttl.total_seconds())
                await self._redis.setex(key, ttl, serialized)
            else:
                await self._redis.set(key, serialized)
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        if not self._enabled or not self._redis:
            return False

        try:
            result = await self._redis.delete(key)
            logger.debug(f"Cache deleted: {key}")
            return bool(result)
        except Exception as e:
            logger.error(f"Redis delete error for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        if not self._enabled or not self._redis:
            return 0

        try:
            keys = []
            async for key in self._redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                deleted = await self._redis.delete(*keys)
                logger.info(f"Deleted {deleted} keys matching pattern: {pattern}")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Redis delete pattern error for {pattern}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        if not self._enabled or not self._redis:
            return False

        try:
            return bool(await self._redis.exists(key))
        except Exception as e:
            logger.error(f"Redis exists error for key {key}: {e}")
            return False

    async def expire(self, key: str, ttl: Union[int, timedelta]) -> bool:
        if not self._enabled or not self._redis:
            return False

        try:
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())
            return bool(await self._redis.expire(key, ttl))
        except Exception as e:
            logger.error(f"Redis expire error for key {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        if not self._enabled or not self._redis:
            return None

        try:
            return await self._redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis increment error for key {key}: {e}")
            return None

    async def get_ttl(self, key: str) -> Optional[int]:
        if not self._enabled or not self._redis:
            return None

        try:
            ttl = await self._redis.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return None

    async def clear_all(self) -> bool:
        if not self._enabled or not self._redis:
            return False

        try:
            await self._redis.flushdb()
            logger.warning("Redis cache cleared (flushdb)")
            return True
        except Exception as e:
            logger.error(f"Redis clear all error: {e}")
            return False

    @property
    def is_connected(self) -> bool:
        return self._enabled and self._redis is not None


redis_cache = RedisCache()


def cache_key(*args, **kwargs) -> str:
    parts = [str(arg) for arg in args]
    parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    return ":".join(parts)


async def get_cache():
    return redis_cache
