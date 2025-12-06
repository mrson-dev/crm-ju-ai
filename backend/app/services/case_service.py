"""
Service para gerenciamento de processos/casos jurídicos usando Cloud SQL PostgreSQL.
"""

from typing import List, Optional
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import Case, CaseCreate, CaseUpdate, CaseStatus
from app.models.db_models import Case as DBCase, CaseStatusEnum
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class CaseService(BaseSQLService[DBCase, CaseCreate, CaseUpdate]):
    """
    Service para operações com processos jurídicos.
    
    Herda operações CRUD do BaseSQLService:
    - create, get, update, delete, count, exists
    
    Adiciona:
    - list_by_status: Lista processos por status
    - list_by_client: Lista processos de um cliente específico
    - count_by_status: Contagem por status para dashboard
    """
    
    model = DBCase
    
    async def list_by_status(
        self,
        db: AsyncSession,
        user_id: str,
        status: CaseStatus,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBCase]:
        """
        Lista processos do usuário filtrados por status.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            status: Status para filtrar
            limit: Máximo de processos
            offset: Offset para paginação
            
        Returns:
            Lista de processos
        """
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            offset=offset,
            filters={"status": CaseStatusEnum(status.value)},
            order_by="created_at",
            descending=True
        )
    
    async def list_by_client(
        self,
        db: AsyncSession,
        client_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[DBCase]:
        """
        Lista processos de um cliente específico.
        
        Args:
            db: Sessão do banco de dados
            client_id: ID do cliente
            user_id: ID do usuário (para verificação de ownership)
            limit: Máximo de processos
            
        Returns:
            Lista de processos do cliente
        """
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"client_id": client_id},
            order_by="created_at",
            descending=True
        )
    
    async def count_by_status(
        self,
        db: AsyncSession,
        user_id: str
    ) -> dict:
        """
        Conta processos por status para dashboard.
        
        Usa GROUP BY para eficiência em PostgreSQL.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            
        Returns:
            Dict com contagem por status {status: count}
        """
        try:
            # Query com GROUP BY (muito mais eficiente que múltiplas queries)
            result = await db.execute(
                select(
                    DBCase.status,
                    func.count(DBCase.id).label('count')
                )
                .where(DBCase.user_id == user_id)
                .group_by(DBCase.status)
            )
            
            # Converter para dict
            counts = {row.status.value: row.count for row in result.all()}
            
            # Garantir que todos os status estejam presentes (mesmo com count 0)
            for status in CaseStatus:
                if status.value not in counts:
                    counts[status.value] = 0
            
            return counts
            
        except Exception as e:
            logger.error(f"Error counting cases by status: {e}")
            raise


# Instância singleton para uso em endpoints
case_service = CaseService()
