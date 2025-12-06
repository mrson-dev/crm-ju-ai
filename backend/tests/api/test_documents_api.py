"""
Testes de integração para endpoints de documentos.
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_list_documents(db_session, mock_firebase_token, test_client):
    """Testa listagem de documentos."""
    # Primeiro criar um cliente
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar cliente
        client_response = await client.post(
            "/api/clients/",
            json={
                "name": "Maria Santos",
                "email": "maria@example.com",
                "phone": "11987654321"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        client_id = client_response.json()["id"]
        
        # Listar documentos (deve estar vazio)
        response = await client.get(
            f"/api/documents/?client_id={client_id}",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_documents_by_case(db_session, mock_firebase_token, test_case):
    """Testa listagem de documentos por processo."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/documents/?case_id={test_case['id']}",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_unauthorized_document_access(db_session):
    """Testa acesso sem autenticação."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/documents/")
        assert response.status_code == 401
