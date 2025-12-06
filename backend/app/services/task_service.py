"""
Service para gerenciamento de tarefas com gamificação (Taskscore).

Sistema inteligente com:
- Pontuação por tarefa concluída
- Níveis de alerta baseados em prazo
- Ranking de produtividade
"""

import logging
from typing import List, Optional, Dict
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import (
    TaskCreate, TaskUpdate, TaskStatus, TaskPriority, TaskType
)
from app.models.db_models import (
    Task as DBTask,
    TaskStatusEnum
)
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class TaskService(BaseSQLService[DBTask, TaskCreate, TaskUpdate]):
    """
    Service para operações com tarefas jurídicas.
    
    Features:
    - CRUD de tarefas (herda de BaseSQLService)
    - Sistema de pontuação (Taskscore)
    - Alertas de prazos
    - Ranking de produtividade
    """
    
    model = DBTask
    
    # Pontuação por tipo de tarefa
    TASK_SCORES = {
        TaskType.AUDIENCIA: 100,
        TaskType.PETICAO: 80,
        TaskType.PRAZO_FATAL: 90,
        TaskType.PRAZO_COMUM: 50,
        TaskType.REUNIAO: 40,
        TaskType.DILIGENCIA: 60,
        TaskType.ANALISE: 70,
        TaskType.CONTATO_CLIENTE: 30,
        TaskType.ADMINISTRATIVO: 20,
        TaskType.OUTRO: 25,
    }
    
    # Multiplicadores por prioridade
    PRIORITY_MULTIPLIERS = {
        TaskPriority.BAIXA: 0.8,
        TaskPriority.MEDIA: 1.0,
        TaskPriority.ALTA: 1.3,
        TaskPriority.URGENTE: 1.5,
    }
    
    def _calculate_score(self, task_type: TaskType, priority: TaskPriority) -> int:
        """Calcula pontuação da tarefa baseado no tipo e prioridade."""
        base_score = self.TASK_SCORES.get(task_type, 25)
        multiplier = self.PRIORITY_MULTIPLIERS.get(priority, 1.0)
        return int(base_score * multiplier)
    
    def _get_alert_level(self, due_date: datetime) -> str:
        """
        Determina o nível de alerta baseado na proximidade do prazo.
        
        Returns:
            "overdue" - Vencido
            "fatal" - Vence hoje
            "critical" - Vence em 1 dia
            "warning" - Vence em 3 dias
            "attention" - Vence em 7 dias
            "normal" - Mais de 7 dias
        """
        now = datetime.now(timezone.utc)
        
        # Se due_date não tem timezone, assume UTC
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)
        
        diff = (due_date - now).days
        
        if diff < 0:
            return "overdue"
        elif diff == 0:
            return "fatal"
        elif diff == 1:
            return "critical"
        elif diff <= 3:
            return "warning"
        elif diff <= 7:
            return "attention"
        else:
            return "normal"
    
    async def create(
        self,
        db: AsyncSession,
        data: TaskCreate | dict,
        user_id: str,
        **extra_fields
    ) -> DBTask:
        """
        Cria uma nova tarefa com pontuação calculada.
        
        Args:
            db: Sessão do banco
            data: Dados da tarefa
            user_id: ID do usuário
            
        Returns:
            Tarefa criada
        """
        # Calcula pontuação
        score = self._calculate_score(data.task_type, data.priority)
        
        # Define nível de alerta inicial
        if data.due_date:
            alert_level = self._get_alert_level(data.due_date)
        else:
            alert_level = "normal"
        
        # Usa create do BaseSQLService com campos extras
        return await super().create(
            db=db,
            data=data,
            user_id=user_id,
            score=score,
            alert_level=alert_level
        )
    
    async def complete_task(
        self,
        db: AsyncSession,
        task_id: str,
        user_id: str,
        completed_by: Optional[str] = None
    ) -> Optional[DBTask]:
        """
        Marca uma tarefa como concluída e registra quem completou.
        
        Args:
            db: Sessão do banco
            task_id: ID da tarefa
            user_id: ID do usuário owner
            completed_by: ID do usuário que completou (pode ser diferente do owner)
        
        Returns:
            Tarefa atualizada ou None
        """
        try:
            task = await self.get(db, task_id, user_id)
            if not task:
                return None
            
            task.status = TaskStatusEnum.CONCLUIDA
            task.completed_at = datetime.now(timezone.utc)
            task.completed_by = completed_by or user_id
            
            await db.commit()
            await db.refresh(task)
            
            logger.info(f"Task {task_id} completed by {task.completed_by}")
            return task
            
        except Exception as e:
            logger.error(f"Error completing task {task_id}: {e}")
            await db.rollback()
            return None
    
    async def list_by_status(
        self,
        db: AsyncSession,
        user_id: str,
        status: TaskStatus,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBTask]:
        """Lista tarefas por status."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            offset=offset,
            filters={"status": TaskStatusEnum(status.value)},
            order_by="due_date"
        )
    
    async def list_by_case(
        self,
        db: AsyncSession,
        case_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[DBTask]:
        """Lista tarefas de um caso específico."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"case_id": case_id},
            order_by="due_date"
        )
    
    async def list_overdue(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 50
    ) -> List[DBTask]:
        """Lista tarefas vencidas (overdue)."""
        try:
            now = datetime.now(timezone.utc)
            
            result = await db.execute(
                select(DBTask)
                .where(
                    DBTask.user_id == user_id,
                    DBTask.status != TaskStatusEnum.CONCLUIDA,
                    DBTask.status != TaskStatusEnum.CANCELADA,
                    DBTask.due_date < now
                )
                .order_by(DBTask.due_date)
                .limit(limit)
            )
            
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error listing overdue tasks: {e}")
            return []
    
    async def get_productivity_stats(
        self,
        db: AsyncSession,
        user_id: str
    ) -> Dict:
        """
        Estatísticas de produtividade (Taskscore).
        
        Args:
            db: Sessão do banco
            user_id: ID do usuário
            
        Returns:
            Dict com total_score, tasks_completed, avg_score
        """
        try:
            # Query para tarefas concluídas
            result = await db.execute(
                select(
                    func.count(DBTask.id).label('tasks_completed'),
                    func.sum(DBTask.score).label('total_score'),
                    func.avg(DBTask.score).label('avg_score')
                )
                .where(
                    DBTask.user_id == user_id,
                    DBTask.status == TaskStatusEnum.CONCLUIDA
                )
            )
            
            row = result.one()
            
            return {
                "tasks_completed": row.tasks_completed or 0,
                "total_score": int(row.total_score or 0),
                "avg_score": float(row.avg_score or 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error getting productivity stats: {e}")
            return {
                "tasks_completed": 0,
                "total_score": 0,
                "avg_score": 0.0
            }


# Instância singleton
task_service = TaskService()
