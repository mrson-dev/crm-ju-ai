"""
Helpers para queries otimizadas e paginação.
"""

from typing import TypeVar, Generic, List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import select, func, Select
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Parâmetros de paginação"""
    page: int = Field(1, ge=1, description="Número da página (começa em 1)")
    page_size: int = Field(50, ge=1, le=200, description="Itens por página")
    
    @property
    def offset(self) -> int:
        """Calcula offset para query"""
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Resposta paginada genérica"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """Cria resposta paginada com cálculos automáticos"""
        total_pages = ceil(total / page_size) if page_size > 0 else 0
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        )


async def paginate_query(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    model_class: type = None
) -> PaginatedResponse:
    """
    Pagina uma query SQLAlchemy.
    
    Args:
        db: Sessão do banco
        query: Query SQLAlchemy (sem limit/offset)
        params: Parâmetros de paginação
        model_class: Classe Pydantic para converter resultados (opcional)
    
    Returns:
        PaginatedResponse com itens e metadados
    
    Example:
        query = select(Client).where(Client.user_id == user_id)
        result = await paginate_query(db, query, params, Client)
    """
    # Conta total de itens
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Aplica paginação
    paginated_query = query.offset(params.offset).limit(params.page_size)
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())
    
    # Converte para Pydantic se necessário
    if model_class:
        items = [model_class.model_validate(item) for item in items]
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size
    )


class FilterParams(BaseModel):
    """Parâmetros de filtro genéricos"""
    search: Optional[str] = Field(None, description="Busca em campos texto")
    sort_by: Optional[str] = Field(None, description="Campo para ordenação")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Ordem: asc ou desc")
    
    def apply_sort(self, query: Select, model_class) -> Select:
        """Aplica ordenação à query"""
        if not self.sort_by:
            return query
        
        # Verifica se campo existe no modelo
        if not hasattr(model_class, self.sort_by):
            return query
        
        sort_column = getattr(model_class, self.sort_by)
        
        if self.sort_order == "desc":
            return query.order_by(sort_column.desc())
        return query.order_by(sort_column.asc())


class DateRangeFilter(BaseModel):
    """Filtro de intervalo de datas"""
    start_date: Optional[str] = Field(None, description="Data inicial (ISO format)")
    end_date: Optional[str] = Field(None, description="Data final (ISO format)")


async def bulk_create(
    db: AsyncSession,
    model_class,
    items: List[Dict[str, Any]],
    user_id: str
) -> List:
    """
    Cria múltiplos registros de uma vez (bulk insert).
    Mais eficiente que criar um por um.
    
    Args:
        db: Sessão do banco
        model_class: Classe do modelo SQLAlchemy
        items: Lista de dicionários com dados
        user_id: ID do usuário
    
    Returns:
        Lista de objetos criados
    
    Example:
        items = [
            {"name": "Cliente 1", "email": "c1@example.com"},
            {"name": "Cliente 2", "email": "c2@example.com"}
        ]
        clients = await bulk_create(db, Client, items, user_id)
    """
    # Adiciona user_id a todos os itens
    for item in items:
        item["user_id"] = user_id
    
    # Cria objetos
    db_objects = [model_class(**item) for item in items]
    
    # Adiciona todos de uma vez
    db.add_all(db_objects)
    await db.commit()
    
    # Refresh para carregar IDs
    for obj in db_objects:
        await db.refresh(obj)
    
    return db_objects


async def exists(
    db: AsyncSession,
    model_class,
    **filters
) -> bool:
    """
    Verifica se existe registro com os filtros especificados.
    Mais eficiente que buscar e contar.
    
    Example:
        email_exists = await exists(db, Client, email="test@example.com", user_id=user_id)
    """
    query = select(model_class).filter_by(**filters).limit(1)
    result = await db.execute(query)
    return result.scalar() is not None


async def count_by_field(
    db: AsyncSession,
    model_class,
    field_name: str,
    user_id: str
) -> Dict[str, int]:
    """
    Conta registros agrupados por um campo.
    
    Example:
        # Conta casos por status
        counts = await count_by_field(db, Case, "status", user_id)
        # Returns: {"novo": 5, "em_andamento": 10, "concluido": 3}
    """
    field = getattr(model_class, field_name)
    
    query = (
        select(field, func.count())
        .where(model_class.user_id == user_id)
        .group_by(field)
    )
    
    result = await db.execute(query)
    
    return {
        str(value): count
        for value, count in result.all()
    }
