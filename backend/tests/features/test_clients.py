"""
Testes para ClientService.
"""
import pytest
from app.features import client_service, ClientCreate, ClientType


@pytest.mark.asyncio
async def test_create_client(db_session, mock_user):
    """Testa criação de cliente."""
    client_data = ClientCreate(
        name="João Silva",
        email="joao@example.com",
        cpf="123.456.789-01",
        phone="(11) 98765-4321",
        client_type=ClientType.individual,
        address="Rua Teste, 123"
    )
    
    client = await client_service.create(db_session, client_data, mock_user["user_id"])
    
    assert client.id is not None
    assert client.name == "João Silva"
    assert client.email == "joao@example.com"
    assert client.client_type == ClientType.individual


@pytest.mark.asyncio
async def test_get_client(db_session, mock_user):
    """Testa busca de cliente por ID."""
    # Criar cliente
    client_data = ClientCreate(
        name="Maria Santos",
        email="maria@example.com",
        cpf="987.654.321-00",
        phone="(21) 91234-5678",
        client_type=ClientType.individual
    )
    created = await client_service.create(db_session, client_data, mock_user["user_id"])
    
    # Buscar cliente
    found = await client_service.get(db_session, created.id, mock_user["user_id"])
    
    assert found is not None
    assert found.id == created.id
    assert found.name == "Maria Santos"


@pytest.mark.asyncio
async def test_list_clients(db_session, mock_user):
    """Testa listagem de clientes."""
    # Criar 2 clientes
    for i in range(2):
        client_data = ClientCreate(
            name=f"Cliente {i}",
            email=f"cliente{i}@example.com",
            cpf=f"111.222.333-{i:02d}",
            phone=f"(11) 9999-000{i}",
            client_type=ClientType.individual
        )
        await client_service.create(db_session, client_data, mock_user["user_id"])
    
    # Listar clientes
    clients = await client_service.list(db_session, mock_user["user_id"], limit=10)
    
    assert len(clients) == 2
