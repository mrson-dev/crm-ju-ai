"""
Testes de integração para endpoints de casos/processos.
"""
import pytest
from httpx import AsyncClient
from datetime import date
from unittest.mock import patch

from app.main import app


@pytest.fixture
def mock_firebase_token():
    """Mock do token Firebase."""
    with patch('app.api.dependencies.auth.verify_id_token') as mock:
        mock.return_value = {
            'uid': 'test_user_123',
            'email': 'test@example.com'
        }
        yield mock


@pytest.mark.asyncio
async def test_create_case(db_session, mock_firebase_token):
    """Testa criação de caso via API."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/cases/",
            json={
                "client_id": "client_123",
                "title": "Ação Trabalhista",
                "description": "Processo de rescisão indireta",
                "case_number": "0001234-56.2025.8.26.0100",
                "court": "TRT 2ª Região",
                "status": "novo",
                "priority": "alta"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Ação Trabalhista"
        assert data["status"] == "novo"
        assert "id" in data


@pytest.mark.asyncio
async def test_list_cases(db_session, mock_firebase_token):
    """Testa listagem de casos via API."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar caso
        await client.post(
            "/api/cases/",
            json={
                "client_id": "client_456",
                "title": "Ação Cível",
                "description": "Indenização por danos morais",
                "status": "em_andamento",
                "priority": "media"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        # Listar casos
        response = await client.get(
            "/api/cases/",
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_filter_cases_by_status(db_session, mock_firebase_token):
    """Testa filtro de casos por status."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar casos com diferentes status
        await client.post(
            "/api/cases/",
            json={
                "client_id": "client_789",
                "title": "Caso Ativo",
                "description": "Teste",
                "status": "em_andamento",
                "priority": "baixa"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        await client.post(
            "/api/cases/",
            json={
                "client_id": "client_789",
                "title": "Caso Arquivado",
                "description": "Teste",
                "status": "arquivado",
                "priority": "baixa"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        # Filtrar por status
        response = await client.get(
            "/api/cases/?status=em_andamento",
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        for case in data:
            assert case["status"] == "em_andamento"
