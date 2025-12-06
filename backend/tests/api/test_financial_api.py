"""
Testes de integração para endpoints financeiros (fees, expenses, invoices, payments).
"""
import pytest
from httpx import AsyncClient
from app.main import app
from datetime import date, datetime


@pytest.mark.asyncio
async def test_create_fee(db_session, mock_firebase_token, test_case):
    """Testa criação de honorário."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/fees/",
            json={
                "case_id": test_case["id"],
                "description": "Honorários contratuais",
                "fee_type": "fixed",
                "amount_cents": 500000,  # R$ 5.000,00
                "installments": 5,
                "due_date": date.today().isoformat()
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Honorários contratuais"
        assert data["fee_type"] == "fixed"
        assert data["amount_cents"] == 500000
        assert data["status"] == "pending"
        assert "id" in data


@pytest.mark.asyncio
async def test_list_fees_by_case(db_session, mock_firebase_token, test_case):
    """Testa listagem de honorários por processo."""
    async with AsyncClient(app=app, base_url="http_test") as client:
        # Criar honorário
        await client.post(
            "/api/fees/",
            json={
                "case_id": test_case["id"],
                "description": "Honorário teste",
                "fee_type": "hourly",
                "amount_cents": 300000
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Listar por processo
        response = await client.get(
            f"/api/fees/?case_id={test_case['id']}",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_create_expense(db_session, mock_firebase_token, test_case):
    """Testa criação de despesa."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/expenses/",
            json={
                "case_id": test_case["id"],
                "category": "custas",
                "description": "Custas processuais",
                "amount_cents": 15000,  # R$ 150,00
                "date": date.today().isoformat()
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "custas"
        assert data["amount_cents"] == 15000
        assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_filter_expenses_by_status(db_session, mock_firebase_token, test_case):
    """Testa filtro de despesas por status."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar despesas com status diferentes
        await client.post(
            "/api/expenses/",
            json={
                "case_id": test_case["id"],
                "category": "viagem",
                "description": "Viagem para audiência",
                "amount_cents": 50000,
                "status": "pending"
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Filtrar por status
        response = await client.get(
            "/api/expenses/?status=pending",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(item["status"] == "pending" for item in data["items"])


@pytest.mark.asyncio
async def test_create_invoice(db_session, mock_firebase_token, test_client):
    """Testa criação de fatura."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/invoices/",
            json={
                "client_id": test_client["id"],
                "invoice_number": "INV-2024-001",
                "issue_date": date.today().isoformat(),
                "due_date": (date.today()).isoformat(),
                "total_amount_cents": 1000000  # R$ 10.000,00
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"] == "INV-2024-001"
        assert data["status"] == "draft"
        assert data["total_amount_cents"] == 1000000


@pytest.mark.asyncio
async def test_list_invoices_by_client(db_session, mock_firebase_token, test_client):
    """Testa listagem de faturas por cliente."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Criar fatura
        await client.post(
            "/api/invoices/",
            json={
                "client_id": test_client["id"],
                "invoice_number": "INV-TEST-001",
                "issue_date": date.today().isoformat(),
                "due_date": date.today().isoformat(),
                "total_amount_cents": 500000
            },
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        # Listar por cliente
        response = await client.get(
            f"/api/invoices/?client_id={test_client['id']}",
            headers={"Authorization": f"Bearer {mock_firebase_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_unauthorized_financial_access(db_session):
    """Testa acesso sem autenticação a endpoints financeiros."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Testar todos os endpoints financeiros
        endpoints = ["/api/fees/", "/api/expenses/", "/api/invoices/", "/api/payments/"]
        
        for endpoint in endpoints:
            response = await client.get(endpoint)
            assert response.status_code == 401
