"""
Testes de integração para endpoints de templates.
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_create_template(db_session, mock_firebase_token):
    """Testa criação de template."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/templates/",
            json={
                "name": "Petição Inicial - Trabalhista",
                "category": "petitions",
                "content": "<p>Exmo. Sr. Doutor Juiz...</p>",
                "variables": ["client_name", "case_number"]
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Petição Inicial - Trabalhista"
        assert data["category"] == "petitions"
        assert "id" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_list_templates(db_session, mock_firebase_token):
    """Testa listagem de templates."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar template primeiro
        await client.post(
            "/api/templates/",
            json={
                "name": "Template Teste",
                "category": "contracts",
                "content": "<p>Teste</p>"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Listar templates
        response = await client.get(
            "/api/templates/",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0
        assert data["items"][0]["name"] == "Template Teste"


@pytest.mark.asyncio
async def test_filter_templates_by_category(db_session, mock_firebase_token):
    """Testa filtro de templates por categoria."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar templates de categorias diferentes
        await client.post(
            "/api/templates/",
            json={
                "name": "Petição 1",
                "category": "petitions",
                "content": "<p>Petição</p>"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        await client.post(
            "/api/templates/",
            json={
                "name": "Contrato 1",
                "category": "contracts",
                "content": "<p>Contrato</p>"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Filtrar por categoria
        response = await client.get(
            "/api/templates/?category=petitions",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["category"] == "petitions" for item in data["items"])


@pytest.mark.asyncio
async def test_get_template_by_id(db_session, mock_firebase_token):
    """Testa busca de template por ID."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar template
        create_response = await client.post(
            "/api/templates/",
            json={
                "name": "Template Específico",
                "category": "petitions",
                "content": "<p>Conteúdo específico</p>"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        template_id = create_response.json()["id"]
        
        # Buscar por ID
        response = await client.get(
            f"/api/templates/{template_id}",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == "Template Específico"


@pytest.mark.asyncio
async def test_unauthorized_template_access(db_session):
    """Testa acesso sem autenticação."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/templates/")
        assert response.status_code == 401
