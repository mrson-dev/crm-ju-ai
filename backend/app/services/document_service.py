"""
Service para gerenciamento de documentos com Cloud Storage + Cloud SQL.

Gerencia upload/download de arquivos no Cloud Storage e metadados no PostgreSQL.
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
import mimetypes
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.firebase import firebase_service
from app.models.schemas import Document, DocumentCreate
from app.models.db_models import Document as DBDocument
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)

# Constantes
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
}


class DocumentService(BaseSQLService[DBDocument, DocumentCreate, dict]):
    """
    Service para operações com documentos e Cloud Storage.
    
    Herda CRUD do BaseSQLService.
    
    Adiciona:
    - upload: Upload de arquivo para Cloud Storage + metadata no PostgreSQL
    - get_with_url: Busca documento com URL assinada temporária
    - list_by_case: Lista documentos de um processo
    - delete_with_file: Remove do Storage e PostgreSQL
    """
    
    model = DBDocument
    
    def __init__(self):
        super().__init__()
        self.bucket = firebase_service.bucket
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitiza nome do arquivo para evitar path traversal e caracteres inválidos.
        
        Args:
            filename: Nome original do arquivo
            
        Returns:
            Nome sanitizado
        """
        import re
        import os
        
        # Remove path components (path traversal prevention)
        filename = os.path.basename(filename)
        
        # Remove caracteres perigosos, mantém apenas alfanuméricos, pontos, hífens e underscores
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        
        # Remove múltiplos pontos consecutivos
        filename = re.sub(r'\.+', '.', filename)
        
        # Garante que não começa com ponto (arquivos ocultos)
        if filename.startswith('.'):
            filename = '_' + filename[1:]
        
        # Limita tamanho do nome
        if len(filename) > 200:
            name, ext = os.path.splitext(filename)
            filename = name[:200-len(ext)] + ext
        
        return filename or 'unnamed_file'
    
    def _validate_file(self, filename: str, content: bytes) -> None:
        """
        Valida arquivo antes do upload.
        
        Args:
            filename: Nome do arquivo
            content: Conteúdo do arquivo
            
        Raises:
            ValueError: Se arquivo inválido
        """
        # Verificar tamanho
        if len(content) > MAX_FILE_SIZE:
            raise ValueError(
                f"Arquivo muito grande. Máximo permitido: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Verificar tipo MIME
        mime_type = mimetypes.guess_type(filename)[0]
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Tipo de arquivo não permitido: {mime_type}. "
                f"Tipos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, GIF, TXT"
            )
    
    def _generate_signed_url(self, storage_path: str, expiration_hours: int = 1) -> str:
        """
        Gera URL assinada temporária para download.
        
        Args:
            storage_path: Caminho no Cloud Storage
            expiration_hours: Horas até expiração
            
        Returns:
            URL assinada
        """
        blob = self.bucket.blob(storage_path)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=expiration_hours),
            method="GET"
        )
    
    async def upload(
        self,
        db: AsyncSession,
        document: DocumentCreate, 
        file_content: bytes, 
        user_id: str
    ) -> Document:
        """
        Faz upload de documento para Cloud Storage e salva metadata no PostgreSQL.
        
        Args:
            db: Sessão do banco de dados
            document: Metadata do documento
            file_content: Conteúdo do arquivo em bytes
            user_id: ID do usuário
            
        Returns:
            Documento criado com URL de download
            
        Raises:
            ValueError: Se arquivo inválido
        """
        # Sanitiza nome do arquivo
        safe_filename = self._sanitize_filename(document.name)
        
        # Valida arquivo
        self._validate_file(safe_filename, file_content)
        
        # Gera path único no storage
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        storage_path = f"documents/{user_id}/{document.case_id}/{timestamp}_{safe_filename}"
        
        # Upload para Cloud Storage
        blob = self.bucket.blob(storage_path)
        content_type = mimetypes.guess_type(safe_filename)[0] or 'application/octet-stream'
        blob.upload_from_string(file_content, content_type=content_type)
        
        logger.info(f"Arquivo enviado para Storage: {storage_path}")
        
        # Atualiza storage_path no document
        document.storage_path = storage_path
        
        # Salva metadata no PostgreSQL usando método herdado
        db_document = await self.create(db, document, user_id)
        
        logger.info(f"Documento criado no PostgreSQL: {db_document.id}")
        
        # Gera URL assinada temporária
        download_url = self._generate_signed_url(storage_path)
        
        # Converte para Pydantic e adiciona URL
        result = Document.model_validate(db_document)
        result.download_url = download_url
        
        return result
    
    async def get(self, db: AsyncSession, document_id: str, user_id: str) -> Optional[Document]:
        """
        Busca documento por ID com URL de download.
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            user_id: ID do usuário
            
        Returns:
            Documento com URL assinada ou None
        """
        # Busca no PostgreSQL usando método herdado
        db_document = await super().get(db, document_id, user_id)
        
        if not db_document:
            logger.debug(f"Documento não encontrado: {document_id}")
            return None
        
        # Converte para Pydantic
        document = Document.model_validate(db_document)
        
        # Gera URL assinada
        document.download_url = self._generate_signed_url(db_document.storage_path)
        
        return document
    
    async def list_by_case(
        self,
        db: AsyncSession,
        case_id: str, 
        user_id: str,
        limit: int = 50
    ) -> List[Document]:
        """
        Lista documentos de um processo.
        
        Args:
            db: Sessão do banco de dados
            case_id: ID do processo
            user_id: ID do usuário
            limit: Máximo de documentos
            
        Returns:
            Lista de documentos com URLs assinadas
        """
        # Busca no PostgreSQL
        query = (
            select(DBDocument)
            .where(DBDocument.user_id == user_id)
            .where(DBDocument.case_id == case_id)
            .order_by(DBDocument.created_at.desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        db_documents = result.scalars().all()
        
        # Converte para Pydantic e adiciona URLs
        documents = []
        for db_doc in db_documents:
            document = Document.model_validate(db_doc)
            document.download_url = self._generate_signed_url(db_doc.storage_path)
            documents.append(document)
        
        logger.info(f"Listados {len(documents)} documentos do case {case_id}")
        return documents
    
    async def delete(self, db: AsyncSession, document_id: str, user_id: str) -> bool:
        """
        Deleta documento do Storage e PostgreSQL.
        
        Args:
            db: Sessão do banco de dados
            document_id: ID do documento
            user_id: ID do usuário
            
        Returns:
            True se deletado, False se não encontrado/não autorizado
        """
        # Busca documento
        db_document = await super().get(db, document_id, user_id)
        
        if not db_document:
            logger.debug(f"Documento não encontrado para delete: {document_id}")
            return False
        
        # Deleta do Cloud Storage
        try:
            blob = self.bucket.blob(db_document.storage_path)
            blob.delete()
            logger.info(f"Arquivo deletado do Storage: {db_document.storage_path}")
        except Exception as e:
            logger.error(f"Erro ao deletar do Storage: {e}")
            # Continua para deletar do PostgreSQL mesmo se falhar no Storage
        
        # Deleta do PostgreSQL usando método herdado
        success = await super().delete(db, document_id, user_id)
        
        if success:
            logger.info(f"Documento deletado: {document_id}")
        
        return success


# Instância singleton para uso em endpoints
document_service = DocumentService()
