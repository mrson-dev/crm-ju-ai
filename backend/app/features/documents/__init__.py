"""
Feature: Gestão de Documentos
"""

from app.services.document_service import document_service
from app.services.document_automation_service import document_automation_service
from app.models.schemas import Document, DocumentCreate

__all__ = [
    'document_service',
    'document_automation_service',
    'Document',
    'DocumentCreate',
]
