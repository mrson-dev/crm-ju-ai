"""
Base Service para operações CRUD com Cloud SQL PostgreSQL.

Substitui o antigo BaseFirestoreService, oferecendo operações
genéricas com SQLAlchemy ORM.
"""

from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import logging

from app.core.database import Base

logger = logging.getLogger(__name__)

# Type variables para genéricos
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseSQLService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Service base para operações CRUD com SQLAlchemy.
    
    Fornece métodos genéricos para:
    - create: Criar novo registro
    - get: Buscar por ID
    - list: Listar com filtros e paginação
    - update: Atualizar registro existente
    - delete: Remover registro
    - count: Contar registros
    - exists: Verificar existência
    
    Usage:
        class ClientService(BaseSQLService[DBClient, ClientCreate, ClientUpdate]):
            model = DBClient
            
            async def custom_method(self, db: AsyncSession):
                # Métodos customizados aqui
                pass
    """
    
    model: Type[ModelType] = None  # Deve ser definido na subclasse
    
    async def create(
        self,
        db: AsyncSession,
        data: CreateSchemaType | dict,
        user_id: str,
        **extra_fields
    ) -> ModelType:
        """
        Cria um novo registro no banco de dados.
        
        Args:
            db: Sessão do banco de dados
            data: Schema Pydantic ou dict com dados para criação
            user_id: ID do usuário (owner)
            **extra_fields: Campos adicionais
            
        Returns:
            Modelo criado
        """
        try:
            # Converter Pydantic para dict
            if hasattr(data, 'model_dump'):
                obj_data = data.model_dump(exclude_unset=True)
            else:
                obj_data = dict(data) if isinstance(data, dict) else {}
            
            # Adicionar user_id e campos extras
            obj_data['user_id'] = user_id
            obj_data.update(extra_fields)
            
            # Criar instância do modelo
            db_obj = self.model(**obj_data)
            
            # Adicionar ao banco
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            
            logger.info(f"{self.model.__name__} created: {db_obj.id}")
            return db_obj
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating {self.model.__name__}: {e}")
            raise
    
    async def get(
        self,
        db: AsyncSession,
        id: str,
        user_id: str
    ) -> Optional[ModelType]:
        """
        Busca um registro por ID.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro
            user_id: ID do usuário (para verificação de ownership)
            
        Returns:
            Modelo encontrado ou None
        """
        try:
            result = await db.execute(
                select(self.model).where(
                    and_(
                        self.model.id == id,
                        self.model.user_id == user_id
                    )
                )
            )
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error getting {self.model.__name__} {id}: {e}")
            raise
    
    async def list(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        order_by: str = "created_at",
        descending: bool = True
    ) -> List[ModelType]:
        """
        Lista registros com paginação e filtros.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            limit: Máximo de registros
            offset: Offset para paginação
            filters: Filtros adicionais {campo: valor}
            order_by: Campo para ordenação
            descending: Se True, ordem decrescente
            
        Returns:
            Lista de modelos
        """
        try:
            # Query base
            query = select(self.model).where(self.model.user_id == user_id)
            
            # Aplicar filtros
            if filters:
                for field, value in filters.items():
                    if value is not None and hasattr(self.model, field):
                        query = query.where(getattr(self.model, field) == value)
            
            # Ordenação
            if order_by and hasattr(self.model, order_by):
                order_column = getattr(self.model, order_by)
                if descending:
                    query = query.order_by(order_column.desc())
                else:
                    query = query.order_by(order_column.asc())
            
            # Paginação
            query = query.limit(limit).offset(offset)
            
            # Executar
            result = await db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error listing {self.model.__name__}: {e}")
            raise
    
    async def list_with_relations(
        self,
        db: AsyncSession,
        user_id: str,
        relations: List[str],
        limit: int = 50,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        order_by: str = "created_at",
        descending: bool = True
    ) -> List[ModelType]:
        """
        Lista registros com eager loading de relacionamentos.
        
        Evita queries N+1 carregando relacionamentos de uma vez usando selectinload.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            relations: Lista de nomes de relacionamentos para carregar (ex: ['cases', 'documents'])
            limit: Máximo de registros
            offset: Offset para paginação
            filters: Filtros adicionais {campo: valor}
            order_by: Campo para ordenação
            descending: Se True, ordem decrescente
            
        Returns:
            Lista de modelos com relacionamentos carregados
            
        Example:
            # Carregar clientes com seus casos
            clients = await client_service.list_with_relations(
                db, user_id, relations=['cases'], limit=20
            )
        """
        try:
            # Query base
            query = select(self.model).where(self.model.user_id == user_id)
            
            # Adicionar eager loading de relacionamentos
            for relation in relations:
                if hasattr(self.model, relation):
                    query = query.options(selectinload(getattr(self.model, relation)))
            
            # Aplicar filtros
            if filters:
                for field, value in filters.items():
                    if value is not None and hasattr(self.model, field):
                        query = query.where(getattr(self.model, field) == value)
            
            # Ordenação
            if order_by and hasattr(self.model, order_by):
                order_column = getattr(self.model, order_by)
                if descending:
                    query = query.order_by(order_column.desc())
                else:
                    query = query.order_by(order_column.asc())
            
            # Paginação
            query = query.limit(limit).offset(offset)
            
            # Executar
            result = await db.execute(query)
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Error listing {self.model.__name__} with relations: {e}")
            raise
    
    async def update(
        self,
        db: AsyncSession,
        id: str,
        data: UpdateSchemaType,
        user_id: str
    ) -> Optional[ModelType]:
        """
        Atualiza um registro existente.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro
            data: Schema Pydantic com dados para atualização
            user_id: ID do usuário (para verificação de ownership)
            
        Returns:
            Modelo atualizado ou None se não encontrado
        """
        try:
            # Buscar registro
            db_obj = await self.get(db, id, user_id)
            if not db_obj:
                return None
            
            # Converter Pydantic para dict (apenas campos definidos)
            update_data = data.model_dump(exclude_unset=True)
            
            # Atualizar campos
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            # Atualizar timestamp
            if hasattr(db_obj, 'updated_at'):
                db_obj.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(db_obj)
            
            logger.info(f"{self.model.__name__} updated: {id}")
            return db_obj
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating {self.model.__name__} {id}: {e}")
            raise
    
    async def delete(
        self,
        db: AsyncSession,
        id: str,
        user_id: str
    ) -> bool:
        """
        Remove um registro.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro
            user_id: ID do usuário (para verificação de ownership)
            
        Returns:
            True se removido, False se não encontrado
        """
        try:
            # Buscar registro
            db_obj = await self.get(db, id, user_id)
            if not db_obj:
                return False
            
            # Remover
            await db.delete(db_obj)
            await db.commit()
            
            logger.info(f"{self.model.__name__} deleted: {id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting {self.model.__name__} {id}: {e}")
            raise
    
    async def count(
        self,
        db: AsyncSession,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Conta registros com filtros opcionais.
        
        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            filters: Filtros adicionais {campo: valor}
            
        Returns:
            Número de registros
        """
        try:
            # Query base
            query = select(func.count()).select_from(self.model).where(
                self.model.user_id == user_id
            )
            
            # Aplicar filtros
            if filters:
                for field, value in filters.items():
                    if value is not None and hasattr(self.model, field):
                        query = query.where(getattr(self.model, field) == value)
            
            # Executar
            result = await db.execute(query)
            return result.scalar()
            
        except Exception as e:
            logger.error(f"Error counting {self.model.__name__}: {e}")
            raise
    
    async def exists(
        self,
        db: AsyncSession,
        id: str,
        user_id: str
    ) -> bool:
        """
        Verifica se um registro existe.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro
            user_id: ID do usuário
            
        Returns:
            True se existe, False caso contrário
        """
        try:
            result = await db.execute(
                select(self.model.id).where(
                    and_(
                        self.model.id == id,
                        self.model.user_id == user_id
                    )
                )
            )
            return result.scalar_one_or_none() is not None
            
        except Exception as e:
            logger.error(f"Error checking existence of {self.model.__name__} {id}: {e}")
            raise
