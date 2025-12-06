"""
Feature: Gestão de Clientes
"""

from app.services.client_service import client_service
from app.models.schemas import Client, ClientCreate, ClientUpdate

__all__ = ['client_service', 'Client', 'ClientCreate', 'ClientUpdate']
