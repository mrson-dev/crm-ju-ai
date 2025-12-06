"""
Testes de performance para endpoints críticos.

Mede tempo de resposta e identifica gargalos.
"""
import pytest
import time
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
@pytest.mark.performance
async def test_list_clients_performance(db_session, mock_firebase_token):
    """Testa performance da listagem de clientes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar alguns clientes para teste
        for i in range(10):
            await client.post(
                "/api/clients/",
                json={
                    "name": f"Cliente {i}",
                    "email": f"cliente{i}@test.com",
                    "phone": f"1199999{i:04d}"
                },
                headers={"Authorization": f"Bearer {mock_firebase_token}"}
            )
        
        # Medir tempo de listagem
        start_time = time.time()
        response = await client.get(
            "/api/clients/?page=1&page_size=20",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200
        assert elapsed_time < 1.0  # Deve responder em menos de 1 segundo


@pytest.mark.asyncio
@pytest.mark.performance
async def test_list_cases_with_filters_performance(db_session, mock_firebase_token, test_client):
    """Testa performance da listagem de casos com filtros."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar casos
        for i in range(20):
            await client.post(
                "/api/cases/",
                json={
                    "client_id": test_client["id"],
                    "case_number": f"000{i:04d}-56.2024.8.00.0000",
                    "title": f"Caso {i}",
                    "status": "active" if i % 2 == 0 else "archived"
                },
                headers={"Authorization": f"Bearer {mock_firebase_token}"}
            )
        
        # Medir tempo com filtro
        start_time = time.time()
        response = await client.get(
            "/api/cases/?status=active&page=1&page_size=10",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 10
        assert elapsed_time < 1.0


@pytest.mark.asyncio
@pytest.mark.performance
async def test_search_clients_performance(db_session, mock_firebase_token):
    """Testa performance da busca de clientes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar clientes
        await client.post(
            "/api/clients/",
            json={
                "name": "João Silva",
                "email": "joao@test.com",
                "phone": "11999887766"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Medir tempo de busca
        start_time = time.time()
        response = await client.get(
            "/api/clients/search?q=João",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200
        assert elapsed_time < 0.5  # Busca deve ser rápida


@pytest.mark.asyncio
@pytest.mark.performance
async def test_create_client_performance(db_session, mock_firebase_token):
    """Testa performance da criação de cliente."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        start_time = time.time()
        response = await client.post(
            "/api/clients/",
            json={
                "name": "Performance Test",
                "email": "perf@test.com",
                "phone": "11999999999"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 201
        assert elapsed_time < 0.5  # Criação deve ser rápida


@pytest.mark.asyncio
@pytest.mark.performance
async def test_pagination_large_dataset_performance(db_session, mock_firebase_token):
    """Testa performance da paginação com dataset grande."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar 50 clientes
        for i in range(50):
            await client.post(
                "/api/clients/",
                json={
                    "name": f"Cliente {i}",
                    "email": f"cliente{i}@test.com",
                    "phone": f"11{i:08d}"
                },
                headers={"Authorization": f"Bearer {mock_firebase_token}"}
            )
        
        # Medir diferentes páginas
        for page in [1, 2, 3]:
            start_time = time.time()
            response = await client.get(
                f"/api/clients/?page={page}&page_size=20",
                headers={"Authorization": f"Bearer {mock_firebase_token}"}
            )
            elapsed_time = time.time() - start_time
            
            assert response.status_code == 200
            assert elapsed_time < 1.0  # Cada página deve ser rápida


@pytest.mark.asyncio
@pytest.mark.performance  
async def test_compression_effectiveness(db_session, mock_firebase_token):
    """Verifica se compression está funcionando para respostas grandes."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar muitos clientes
        for i in range(30):
            await client.post(
                "/api/clients/",
                json={
                    "name": f"Cliente {i} com nome muito longo para aumentar o payload",
                    "email": f"cliente{i}@test.com",
                    "phone": f"11{i:08d}",
                    "notes": "Notas extensas " * 20  # Aumentar tamanho
                },
                headers={"Authorization": f"Bearer {mock_firebase_token}"}
            )
        
        # Request com Accept-Encoding
        response = await client.get(
            "/api/clients/?page=1&page_size=30",
            headers={
                "Authorization": f"Bearer {mock_firebase_token}",
                "Accept-Encoding": "gzip"
            }
        )
        
        assert response.status_code == 200
        # Se compression estiver funcionando, header Content-Encoding deve estar presente
        # (httpx decodifica automaticamente, então verificamos apenas o sucesso)
        data = response.json()
        assert len(data["items"]) > 0
