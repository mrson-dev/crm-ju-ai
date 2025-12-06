"""
Testes de integração para endpoints de clientes.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

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
async def test_create_client(db_session, mock_firebase_token):
    """Testa criação de cliente via API."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/clients/",
            json={
                "name": "João Silva",
                "email": "joao@example.com",
                "cpf_cnpj": "123.456.789-01",
                "phone": "(11) 98765-4321",
                "client_type": "pessoa_fisica"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "João Silva"
        assert data["email"] == "joao@example.com"
        assert "id" in data


@pytest.mark.asyncio
async def test_list_clients(db_session, mock_firebase_token):
    """Testa listagem de clientes via API."""
    # Criar um cliente primeiro
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.post(
            "/api/clients/",
            json={
                "name": "Maria Santos",
                "email": "maria@example.com",
                "cpf_cnpj": "987.654.321-00",
                "phone": "(21) 91234-5678",
                "client_type": "pessoa_fisica"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        # Listar clientes
        response = await client.get(
            "/api/clients/",
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


@pytest.mark.asyncio
async def test_search_clients(db_session, mock_firebase_token):
    """Testa busca de clientes via API."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar cliente
        await client.post(
            "/api/clients/",
            json={
                "name": "Pedro Costa",
                "email": "pedro@example.com",
                "cpf_cnpj": "111.222.333-44",
                "phone": "(11) 99999-0000",
                "client_type": "pessoa_fisica"
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        # Buscar por nome
        response = await client.get(
            "/api/clients/search?query=Pedro",
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "Pedro" in data[0]["name"]


@pytest.mark.asyncio
async def test_unauthorized_access(db_session):
    """Testa acesso sem autenticação."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/clients/")
        
        assert response.status_code == 403  # Forbidden sem token
