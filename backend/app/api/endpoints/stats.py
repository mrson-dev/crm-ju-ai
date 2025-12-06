from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.cache_decorators import cached, invalidate_cache_pattern
from app.core.redis_cache import redis_cache
from app.models.case import Case
from app.models.client import Client
from app.models.document import Document
from app.models.task import Task
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
@cached(ttl=300, key_prefix="dashboard", include_user=True)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retorna estatísticas do dashboard.
    
    Este endpoint é cacheado por 5 minutos para melhorar performance.
    """
    # Total de casos
    total_cases = await db.scalar(
        select(func.count(Case.id))
        .where(Case.user_id == current_user.id)
    )
    
    # Casos ativos
    active_cases = await db.scalar(
        select(func.count(Case.id))
        .where(Case.user_id == current_user.id)
        .where(Case.status.in_(["active", "pending"]))
    )
    
    # Total de clientes
    total_clients = await db.scalar(
        select(func.count(Client.id))
        .where(Client.user_id == current_user.id)
    )
    
    # Documentos recentes (últimos 7 dias)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_documents = await db.scalar(
        select(func.count(Document.id))
        .where(Document.user_id == current_user.id)
        .where(Document.created_at >= seven_days_ago)
    )
    
    # Tarefas pendentes
    pending_tasks = await db.scalar(
        select(func.count(Task.id))
        .where(Task.user_id == current_user.id)
        .where(Task.status == "pending")
    )
    
    return {
        "total_cases": total_cases or 0,
        "active_cases": active_cases or 0,
        "total_clients": total_clients or 0,
        "recent_documents": recent_documents or 0,
        "pending_tasks": pending_tasks or 0,
        "cached_at": datetime.utcnow().isoformat(),
        "cache_enabled": redis_cache.is_connected
    }


@router.get("/stats/cases")
@cached(ttl=600, key_prefix="stats:cases", include_user=True)
async def get_case_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retorna estatísticas detalhadas de casos.
    
    Cacheado por 10 minutos.
    """
    # Casos por status
    cases_by_status = await db.execute(
        select(Case.status, func.count(Case.id))
        .where(Case.user_id == current_user.id)
        .group_by(Case.status)
    )
    
    status_counts = {status: count for status, count in cases_by_status}
    
    # Casos criados nos últimos 30 dias
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_cases = await db.scalar(
        select(func.count(Case.id))
        .where(Case.user_id == current_user.id)
        .where(Case.created_at >= thirty_days_ago)
    )
    
    return {
        "by_status": status_counts,
        "recent_cases_30d": recent_cases or 0,
        "cached_at": datetime.utcnow().isoformat()
    }


@router.post("/cache/invalidate")
async def invalidate_user_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Invalida todo o cache do usuário atual.
    
    Útil após operações que modificam dados que afetam estatísticas.
    """
    if not redis_cache.is_connected:
        raise HTTPException(
            status_code=503,
            detail="Cache service is not available"
        )
    
    deleted = await invalidate_cache_pattern(f"*user:{current_user.id}*")
    
    return {
        "message": "Cache invalidated successfully",
        "keys_deleted": deleted
    }


@router.get("/cache/info")
async def get_cache_info(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retorna informações sobre o estado do cache.
    """
    return {
        "enabled": redis_cache.is_connected,
        "status": "connected" if redis_cache.is_connected else "disconnected"
    }
