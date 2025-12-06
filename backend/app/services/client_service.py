"""
Service para gerenciamento de clientes usando Cloud SQL PostgreSQL.
"""

from typing import List
import logging
from sqlalchemy import select, or_, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import Client, ClientCreate, ClientUpdate
from app.models.db_models import Client as DBClient
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class ClientService(BaseSQLService[DBClient, ClientCreate, ClientUpdate]):
    """
    Service para operações com clientes.
    
    Herda operações CRUD do BaseSQLService:
    - create, get, list, update, delete, count, exists
    
    Adiciona:
    - search: Busca por nome, email, CPF ou telefone usando PostgreSQL ILIKE
    """
    
    model = DBClient
    
    async def search(
        self,
        db: AsyncSession,
        user_id: str,
        query: str,
        limit: int = 50
    ) -> List[DBClient]:
        """
        Busca clientes por nome, email, CPF ou telefone.
        
        Usa PostgreSQL ILIKE para busca case-insensitive em múltiplos campos.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            query: Texto para buscar
            limit: Máximo de resultados
            
        Returns:
            Lista de clientes que correspondem à busca
        """
        try:
            # Remove caracteres especiais da query para busca de CPF/telefone
            clean_query = query.replace('.', '').replace('-', '').replace('(', '').replace(')', '').replace('/', '').replace(' ', '')
            
            # Query com ILIKE (case-insensitive) em múltiplos campos
            result = await db.execute(
                select(DBClient)
                .where(
                    and_(
                        DBClient.user_id == user_id,
                        or_(
                            DBClient.name.ilike(f'%{query}%'),
                            DBClient.email.ilike(f'%{query}%'),
                            DBClient.cpf_cnpj.ilike(f'%{clean_query}%'),
                            DBClient.phone.ilike(f'%{clean_query}%'),
                            DBClient.secondary_phone.ilike(f'%{clean_query}%'),
                            # Busca em JSON documents.rg
                            func.jsonb_extract_path_text(DBClient.documents, 'rg').ilike(f'%{query}%')
                        )
                    )
                )
                .order_by(DBClient.name)
                .limit(limit)
            )
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error searching clients: {e}")
            raise


# Instância singleton para uso em endpoints
client_service = ClientService()
