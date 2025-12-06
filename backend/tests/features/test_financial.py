"""
Testes para serviços financeiros.
"""
import pytest
from datetime import date
from app.features import (
    fee_service, expense_service,
    FeeCreate, ExpenseCreate,
    FeeType, FeeStatus, ExpenseCategory, ExpenseStatus
)


@pytest.mark.asyncio
async def test_create_fee(db_session, mock_user):
    """Testa criação de honorário."""
    fee_data = FeeCreate(
        case_id="case_123",
        client_id="client_456",
        description="Honorários advocatícios",
        fee_type=FeeType.fixed,
        amount_cents=500000,  # R$ 5.000,00
        installments=3,
        due_date=date(2025, 12, 31)
    )
    
    fee = await fee_service.create(db_session, fee_data, mock_user["user_id"])
    
    assert fee.id is not None
    assert fee.amount_cents == 500000
    assert fee.installments == 3
    assert fee.status == FeeStatus.pending


@pytest.mark.asyncio
async def test_create_expense(db_session, mock_user):
    """Testa criação de despesa."""
    expense_data = ExpenseCreate(
        case_id="case_123",
        category=ExpenseCategory.court_fees,
        description="Custas processuais",
        amount_cents=25000,  # R$ 250,00
        date=date.today()
    )
    
    expense = await expense_service.create(db_session, expense_data, mock_user["user_id"])
    
    assert expense.id is not None
    assert expense.amount_cents == 25000
    assert expense.status == ExpenseStatus.pending_approval
    assert expense.category == ExpenseCategory.court_fees


@pytest.mark.asyncio
async def test_approve_expense(db_session, mock_user):
    """Testa aprovação de despesa."""
    # Criar despesa
    expense_data = ExpenseCreate(
        case_id="case_123",
        category=ExpenseCategory.office,
        description="Material de escritório",
        amount_cents=15000,
        date=date.today()
    )
    expense = await expense_service.create(db_session, expense_data, mock_user["user_id"])
    
    # Aprovar despesa
    approved = await expense_service.approve_expense(
        db_session,
        expense.id,
        mock_user["user_id"]
    )
    
    assert approved.status == ExpenseStatus.approved
    assert approved.approved_by == mock_user["user_id"]
    assert approved.approved_at is not None
