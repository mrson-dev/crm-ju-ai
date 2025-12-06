"""
Feature: Templates de Documentos
"""

from app.services.template_service import template_service
from app.models.schemas import Template, TemplateCreate, TemplateUpdate

__all__ = ['template_service', 'Template', 'TemplateCreate', 'TemplateUpdate']
