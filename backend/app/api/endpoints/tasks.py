"""
Endpoints para gerenciamento de tarefas com gamificação.

Sistema Taskscore inspirado na ADVBOX:
- CRUD de tarefas
- Pontuação automática
- Ranking de produtividade
- Alertas de prazos
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.features import (
    task_service,
    Task, TaskCreate, TaskUpdate, TaskStatus, User
)
from app.core.database import get_async_db


router = APIRouter(prefix="/tasks", tags=["tasks"])


# ==================== CRUD Endpoints ====================

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Cria uma nova tarefa.
    
    A pontuação (Taskscore) é calculada automaticamente baseada no tipo e prioridade.
    
    Pontuação por tipo:
    - Audiência: 100 pts
    - Prazo Fatal: 90 pts
    - Petição: 80 pts
    - Análise: 70 pts
    - Diligência: 60 pts
    - Prazo Comum: 50 pts
    - Reunião: 40 pts
    - Contato Cliente: 30 pts
    - Outro: 25 pts
    - Administrativo: 20 pts
    
    Multiplicadores de prioridade:
    - Urgente: 1.5x
    - Alta: 1.3x
    - Média: 1.0x
    - Baixa: 0.8x
    """
    try:
        return await task_service.create(db, task_data, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar tarefa: {str(e)}"
        )


@router.get("/", response_model=List[Task])
async def list_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    case_id: Optional[str] = None,
    client_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    alert_level: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Lista tarefas com filtros.
    
    Filtros disponíveis:
    - status: pendente, em_andamento, concluida, cancelada
    - case_id: filtrar por caso
    - client_id: filtrar por cliente
    - assigned_to: filtrar por responsável
    - alert_level: normal, attention, warning, critical, fatal, overdue
    """
    try:
        if status_filter:
            return await task_service.list_by_status(db, current_user.id, status_filter, limit, offset)
        elif case_id:
            return await task_service.list_by_case(db, case_id, current_user.id, limit)
        else:
            return await task_service.list(db, current_user.id, limit, offset)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar tarefas: {str(e)}"
        )


@router.get("/overdue", response_model=List[Task])
async def get_overdue_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Lista todas as tarefas vencidas não concluídas."""
    try:
        return await task_service.list_overdue(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar tarefas vencidas: {str(e)}"
        )


@router.get("/stats")
async def get_task_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Retorna estatísticas gerais das tarefas.
    
    Inclui:
    - Total de tarefas
    - Distribuição por status, prioridade, tipo e nível de alerta
    - Pontuação total e pontuação de concluídas
    - Quantidade de tarefas vencidas
    """
    try:
        return await task_service.get_productivity_stats(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular estatísticas: {str(e)}"
        )


@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Busca uma tarefa específica pelo ID."""
    task = await task_service.get(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return task


@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Atualiza uma tarefa existente."""
    task = await task_service.update(db, task_id, task_data, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Remove uma tarefa."""
    success = await task_service.delete(db, task_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return {"message": "Tarefa removida com sucesso"}


# ==================== Taskscore / Gamification Endpoints ====================

@router.post("/{task_id}/complete", response_model=Task)
async def complete_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Marca uma tarefa como concluída.
    
    Registra quem completou a tarefa para o cálculo do Taskscore.
    """
    task = await task_service.complete_task(
        task_id=task_id, 
        user_id=current_user.id,
        completed_by=current_user.id
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarefa não encontrada"
        )
    return task


@router.get("/taskscore/ranking")
async def get_taskscore_ranking(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o ranking de produtividade (Taskscore).
    
    O ranking é calculado com base nas tarefas concluídas no período especificado.
    Cada tarefa tem uma pontuação baseada em seu tipo e prioridade.
    
    Args:
        start_date: Data inicial do período (opcional)
        end_date: Data final do período (opcional)
    
    Returns:
        Lista ordenada por pontuação com:
        - user_id: ID do usuário
        - total_score: Pontuação total
        - tasks_completed: Número de tarefas concluídas
        - tasks_by_type: Distribuição por tipo de tarefa
        - rank: Posição no ranking
    """
    try:
        return await task_service.get_taskscore_ranking(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular ranking: {str(e)}"
        )


@router.get("/taskscore/my-score")
async def get_my_taskscore(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o Taskscore do usuário atual.
    
    Calcula a pontuação do usuário logado com base nas tarefas
    que ele completou no período especificado.
    """
    try:
        ranking = await task_service.get_taskscore_ranking(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Encontra o score do usuário atual
        my_score = next(
            (entry for entry in ranking if entry["user_id"] == current_user.id),
            {
                "user_id": current_user.id,
                "total_score": 0,
                "tasks_completed": 0,
                "tasks_by_type": {},
                "rank": len(ranking) + 1
            }
        )
        
        return my_score
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular seu Taskscore: {str(e)}"
        )


# ==================== Batch Operations ====================

@router.post("/batch/complete")
async def batch_complete_tasks(
    task_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """
    Marca múltiplas tarefas como concluídas.
    
    Útil para completar várias tarefas de uma vez.
    """
    results = {
        "success": [],
        "failed": []
    }
    
    for task_id in task_ids:
        try:
            task = await task_service.complete_task(
                task_id=task_id,
                user_id=current_user.id,
                completed_by=current_user.id
            )
            if task:
                results["success"].append(task_id)
            else:
                results["failed"].append({
                    "task_id": task_id,
                    "error": "Tarefa não encontrada"
                })
        except Exception as e:
            results["failed"].append({
                "task_id": task_id,
                "error": str(e)
            })
    
    return results


@router.post("/batch/update-status")
async def batch_update_status(
    task_ids: List[str],
    new_status: TaskStatus,
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza o status de múltiplas tarefas.
    """
    results = {
        "success": [],
        "failed": []
    }
    
    for task_id in task_ids:
        try:
            task = await task_service.update(
                task_id, 
                TaskUpdate(status=new_status), 
                current_user.id
            )
            if task:
                results["success"].append(task_id)
            else:
                results["failed"].append({
                    "task_id": task_id,
                    "error": "Tarefa não encontrada"
                })
        except Exception as e:
            results["failed"].append({
                "task_id": task_id,
                "error": str(e)
            })
    
    return results
