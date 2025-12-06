"""
Configuração de fixtures pytest para testes do CRM.
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.database import Base
from app.core.config import settings

# URL de teste (usar banco separado ou in-memory)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/crm_test"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Cria event loop para testes assíncronos."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Cria engine de teste."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Cria sessão de banco de dados para testes."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session


@pytest.fixture
def mock_user():
    """Usuário mock para testes."""
    return {
        "user_id": "test_user_123",
        "email": "test@example.com"
    }


@pytest.fixture
def mock_firebase_token():
    """Token Firebase mock para autenticação nos testes."""
    return "mock_firebase_token_for_testing"


@pytest.fixture
async def test_client(db_session, mock_firebase_token):
    """Cliente de teste criado no banco."""
    from httpx import AsyncClient
    from app.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/clients/",
            json={
                "name": "Cliente Teste",
                "email": "cliente@test.com",
                "phone": "11999999999",
                "document": "12345678900"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        return response.json()


@pytest.fixture
async def test_case(db_session, mock_firebase_token, test_client):
    """Processo de teste criado no banco."""
    from httpx import AsyncClient
    from app.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/cases/",
            json={
                "client_id": test_client["id"],
                "case_number": "0001234-56.2024.8.00.0000",
                "title": "Processo Teste",
                "description": "Descrição do processo teste",
                "status": "active"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        return response.json()

