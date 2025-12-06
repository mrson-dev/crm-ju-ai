"""
Service para Automação de Documentos com Cloud SQL.

Sistema de geração de documentos jurídicos com tracking de templates usados.
"""

import logging
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import DocumentAutomation as DBDocumentAutomation
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class DocumentAutomationService(BaseSQLService[DBDocumentAutomation, dict, dict]):
    """
    Service para automação de documentos jurídicos.
    
    Features:
    - CRUD de documentos gerados (herda de BaseSQLService)
    - Tracking de templates utilizados
    - Versionamento de documentos
    - Histórico de gerações
    """
    
    model = DBDocumentAutomation
    
    async def list_by_template(
        self,
        db: AsyncSession,
        template_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[DBDocumentAutomation]:
        """Lista documentos gerados de um template específico."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"template_id": template_id},
            order_by="created_at",
            descending=True
        )
    
    async def list_by_case(
        self,
        db: AsyncSession,
        case_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[DBDocumentAutomation]:
        """Lista documentos gerados para um caso específico."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"case_id": case_id},
            order_by="created_at",
            descending=True
        )
    
    async def list_by_client(
        self,
        db: AsyncSession,
        client_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[DBDocumentAutomation]:
        """Lista documentos gerados para um cliente específico."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"client_id": client_id},
            order_by="created_at",
            descending=True
        )
    
    async def update_status(
        self,
        db: AsyncSession,
        document_id: str,
        user_id: str,
        status: str
    ) -> Optional[DBDocumentAutomation]:
        """
        Atualiza status de um documento gerado.
        
        Args:
            db: Sessão do banco
            document_id: ID do documento
            user_id: ID do usuário
            status: Novo status (generated, sent, signed, etc)
            
        Returns:
            Documento atualizado ou None
        """
        try:
            document = await self.get(db, document_id, user_id)
            if not document:
                return None
            
            document.status = status
            await db.commit()
            await db.refresh(document)
            
            logger.info(f"Document automation {document_id} status updated to {status}")
            return document
            
        except Exception as e:
            logger.error(f"Error updating document automation status: {e}")
            await db.rollback()
            return None


# Instância singleton
document_automation_service = DocumentAutomationService()
