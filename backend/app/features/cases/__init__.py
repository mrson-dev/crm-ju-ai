"""
Feature: Gestão de Processos/Casos
"""

from app.services.case_service import case_service
from app.models.schemas import Case, CaseCreate, CaseUpdate, CaseStatus, CasePriority

__all__ = ['case_service', 'Case', 'CaseCreate', 'CaseUpdate', 'CaseStatus', 'CasePriority']
