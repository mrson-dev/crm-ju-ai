"""
Service para gerenciamento de templates de documentos jurídicos usando Cloud SQL.

Templates podem ser privados ou públicos (compartilhados).
"""

from typing import List, Optional
import logging
import re

from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import Template, TemplateCreate, TemplateUpdate
from app.models.db_models import Template as DBTemplate, TemplateCategoryEnum
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class TemplateService(BaseSQLService[DBTemplate, TemplateCreate, TemplateUpdate]):
    """
    Service para operações com templates de documentos.
    
    Herda operações CRUD do BaseSQLService.
    
    Adiciona:
    - create_with_variables: Extrai placeholders automaticamente
    - list_with_public: Lista templates do usuário + públicos
    - search: Busca por nome/descrição
    - increment_usage: Incrementa contador de uso
    """
    
    model = DBTemplate
    
    def _extract_placeholders(self, content: str) -> List[str]:
        """
        Extrai placeholders do conteúdo no formato {{variavel}}.
        
        Args:
            content: Conteúdo do template
            
        Returns:
            Lista de placeholders únicos
        """
        pattern = r'\{\{([a-zA-Z0-9_\.]+)\}\}'
        matches = re.findall(pattern, content)
        return list(set(matches))  # Remove duplicatas
    
    async def create(
        self,
        db: AsyncSession,
        data: TemplateCreate,
        user_id: str
    ) -> DBTemplate:
        """
        Cria template extraindo placeholders automaticamente.
        
        Args:
            db: Sessão do banco
            data: Dados do template
            user_id: ID do usuário
            
        Returns:
            Template criado
        """
        # Extrai variáveis do conteúdo
        variables = self._extract_placeholders(data.content)
        
        # Cria dict com variáveis extraídas
        template_dict = data.model_dump()
        template_dict['variables'] = variables
        
        # Usa create do BaseSQLService
        return await super().create(
            db=db,
            data=template_dict,
            user_id=user_id
        )
    
    async def get(
        self,
        db: AsyncSession,
        template_id: str,
        user_id: str
    ) -> Optional[DBTemplate]:
        """
        Busca template por ID.
        
        Permite acesso se:
        - Template pertence ao usuário, OU
        - Template é público
        
        Args:
            db: Sessão do banco
            template_id: ID do template
            user_id: ID do usuário
            
        Returns:
            Template encontrado ou None
        """
        try:
            result = await db.execute(
                select(DBTemplate).where(
                    and_(
                        DBTemplate.id == template_id,
                        or_(
                            DBTemplate.user_id == user_id,
                            DBTemplate.is_public == True
                        )
                    )
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting template {template_id}: {e}")
            return None
    
    async def list_with_public(
        self,
        db: AsyncSession,
        user_id: str,
        category: Optional[str] = None,
        include_public: bool = True,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBTemplate]:
        """
        Lista templates do usuário e opcionalmente públicos.
        
        Args:
            db: Sessão do banco
            user_id: ID do usuário
            category: Filtrar por categoria
            include_public: Incluir templates públicos
            limit: Máximo de templates
            offset: Offset para paginação
            
        Returns:
            Lista de templates
        """
        try:
            # Monta query base
            conditions = []
            
            if include_public:
                # Templates do usuário OU públicos
                conditions.append(
                    or_(
                        DBTemplate.user_id == user_id,
                        DBTemplate.is_public == True
                    )
                )
            else:
                # Apenas templates do usuário
                conditions.append(DBTemplate.user_id == user_id)
            
            # Filtro por categoria
            if category:
                conditions.append(
                    DBTemplate.category == TemplateCategoryEnum(category)
                )
            
            # Query
            result = await db.execute(
                select(DBTemplate)
                .where(and_(*conditions))
                .order_by(DBTemplate.usage_count.desc(), DBTemplate.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error listing templates: {e}")
            return []
    
    async def search(
        self,
        db: AsyncSession,
        user_id: str,
        query: str,
        include_public: bool = True,
        limit: int = 20
    ) -> List[DBTemplate]:
        """
        Busca templates por nome ou descrição.
        
        Args:
            db: Sessão do banco
            user_id: ID do usuário
            query: Termo de busca
            include_public: Incluir templates públicos
            limit: Máximo de resultados
            
        Returns:
            Lista de templates encontrados
        """
        try:
            search_pattern = f"%{query}%"
            
            # Condições de ownership
            ownership_condition = (
                or_(
                    DBTemplate.user_id == user_id,
                    DBTemplate.is_public == True
                ) if include_public else DBTemplate.user_id == user_id
            )
            
            # Query com busca ILIKE
            result = await db.execute(
                select(DBTemplate)
                .where(
                    and_(
                        ownership_condition,
                        or_(
                            DBTemplate.name.ilike(search_pattern),
                            DBTemplate.description.ilike(search_pattern)
                        )
                    )
                )
                .order_by(DBTemplate.usage_count.desc())
                .limit(limit)
            )
            
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error searching templates: {e}")
            return []
    
    async def increment_usage(
        self,
        db: AsyncSession,
        template_id: str,
        user_id: str
    ) -> bool:
        """
        Incrementa contador de uso do template.
        
        Args:
            db: Sessão do banco
            template_id: ID do template
            user_id: ID do usuário (para verificar acesso)
            
        Returns:
            True se incrementado com sucesso
        """
        try:
            # Verifica se template existe e usuário tem acesso
            template = await self.get(db, template_id, user_id)
            if not template:
                return False
            
            # Incrementa contador
            template.usage_count += 1
            await db.commit()
            await db.refresh(template)
            
            logger.info(f"Usage count incremented for template {template_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error incrementing usage for template {template_id}: {e}")
            await db.rollback()
            return False
    
    async def toggle_favorite(
        self,
        db: AsyncSession,
        template_id: str,
        user_id: str
    ) -> Optional[DBTemplate]:
        """
        Alterna status de favorito do template.
        
        Args:
            db: Sessão do banco
            template_id: ID do template
            user_id: ID do usuário
            
        Returns:
            Template atualizado ou None
        """
        try:
            # Busca template (apenas do usuário, não públicos)
            template = await super().get(db, template_id, user_id)
            if not template:
                return None
            
            # Alterna favorito
            template.is_favorite = not template.is_favorite
            await db.commit()
            await db.refresh(template)
            
            logger.info(f"Favorite toggled for template {template_id}")
            return template
            
        except Exception as e:
            logger.error(f"Error toggling favorite for template {template_id}: {e}")
            await db.rollback()
            return None


# Instância singleton
template_service = TemplateService()
