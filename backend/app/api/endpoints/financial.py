"""
Endpoints de Controle Financeiro com Cloud SQL.
Gerencia honorários, despesas, faturas e pagamentos.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.features import (
    fee_service,
    expense_service,
    invoice_service,
    payment_service,
    Fee, FeeCreate,
    Expense, ExpenseCreate,
    Invoice, InvoiceCreate,
    Payment, PaymentCreate,
    FeeStatus, ExpenseStatus, InvoiceStatus
)
from app.api.dependencies import get_current_user
from app.core.database import get_async_db
from app.core.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter()


# ==================== HONORÁRIOS ====================

@router.post("/fees", response_model=Fee, status_code=status.HTTP_201_CREATED)
async def create_fee(
    data: FeeCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Cria um novo honorário."""
    db_fee = await fee_service.create(db, data, current_user["user_id"])
    return Fee.model_validate(db_fee)


@router.get("/fees", response_model=PaginatedResponse[Fee])
async def list_fees(
    client_id: Optional[str] = None,
    case_id: Optional[str] = None,
    status_filter: Optional[FeeStatus] = None,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista honorários com filtros e paginação."""
    # Usar método otimizado que filtra no SQL
    items = await fee_service.list_with_filters(
        db, 
        current_user["user_id"],
        client_id=client_id,
        case_id=case_id,
        status=status_filter,
        limit=pagination.limit,
        offset=pagination.offset
    )
    
    # Contar total com os mesmos filtros
    total = await fee_service.count_with_filters(
        db,
        current_user["user_id"],
        client_id=client_id,
        case_id=case_id,
        status=status_filter
    )
    
    return PaginatedResponse.create(
        [Fee.model_validate(f) for f in items],
        total,
        pagination.page,
        pagination.page_size
    )


@router.get("/fees/{fee_id}", response_model=Fee)
async def get_fee(
    fee_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtém detalhes de um honorário."""
    fee = await fee_service.get(db, fee_id, current_user["user_id"])
    if not fee:
        raise HTTPException(status_code=404, detail="Honorário não encontrado")
    return Fee.model_validate(fee)


@router.post("/fees/{fee_id}/payment", response_model=Fee)
async def record_fee_payment(
    fee_id: str,
    data: PaymentCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Registra pagamento de honorário."""
    try:
        # Cria pagamento
        await payment_service.create(db, data, current_user["user_id"], fee_id=fee_id)
        
        # Atualiza honorário
        payment_dict = data.model_dump()
        fee = await fee_service.register_payment(
            db, fee_id, current_user["user_id"], payment_dict
        )
        
        return Fee.model_validate(fee)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/fees/{fee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fee(
    fee_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Deleta um honorário."""
    success = await fee_service.delete(db, fee_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Honorário não encontrado")


# ==================== DESPESAS ====================

@router.post("/expenses", response_model=Expense, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Cria uma nova despesa."""
    db_expense = await expense_service.create(db, data, current_user["user_id"])
    return Expense.model_validate(db_expense)


@router.get("/expenses", response_model=PaginatedResponse[Expense])
async def list_expenses(
    status_filter: Optional[ExpenseStatus] = None,
    category: Optional[str] = None,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista despesas com filtros e paginação."""
    # Usar método otimizado que filtra no SQL
    items = await expense_service.list_with_filters(
        db,
        current_user["user_id"],
        status=status_filter,
        category=category,
        limit=pagination.limit,
        offset=pagination.offset
    )
    
    # Contar total com os mesmos filtros
    total = await expense_service.count_with_filters(
        db,
        current_user["user_id"],
        status=status_filter,
        category=category
    )
    
    return PaginatedResponse.create(
        [Expense.model_validate(e) for e in items],
        total,
        pagination.page,
        pagination.page_size
    )


@router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtém detalhes de uma despesa."""
    expense = await expense_service.get(db, expense_id, current_user["user_id"])
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    return Expense.model_validate(expense)


@router.post("/expenses/{expense_id}/approve", response_model=Expense)
async def approve_expense(
    expense_id: str,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Aprova uma despesa."""
    try:
        expense = await expense_service.approve(
            db, expense_id, current_user["user_id"],
            current_user["user_id"], notes
        )
        return Expense.model_validate(expense)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Deleta uma despesa."""
    success = await expense_service.delete(db, expense_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")


# ==================== FATURAS ====================

@router.post("/invoices", response_model=Invoice, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Cria uma nova fatura."""
    db_invoice = await invoice_service.create(db, data, current_user["user_id"])
    return Invoice.model_validate(db_invoice)


@router.get("/invoices", response_model=PaginatedResponse[Invoice])
async def list_invoices(
    client_id: Optional[str] = None,
    status_filter: Optional[InvoiceStatus] = None,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista faturas com filtros e paginação."""
    # Usar método otimizado que filtra no SQL
    items = await invoice_service.list_with_filters(
        db,
        current_user["user_id"],
        client_id=client_id,
        status=status_filter,
        limit=pagination.limit,
        offset=pagination.offset
    )
    
    # Contar total com os mesmos filtros
    total = await invoice_service.count_with_filters(
        db,
        current_user["user_id"],
        client_id=client_id,
        status=status_filter
    )
    
    return PaginatedResponse.create(
        [Invoice.model_validate(i) for i in items],
        total,
        pagination.page,
        pagination.page_size
    )


@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtém detalhes de uma fatura."""
    invoice = await invoice_service.get(db, invoice_id, current_user["user_id"])
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    return Invoice.model_validate(invoice)


@router.post("/invoices/{invoice_id}/send", response_model=Invoice)
async def send_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Marca fatura como enviada."""
    try:
        invoice = await invoice_service.mark_as_sent(
            db, invoice_id, current_user["user_id"]
        )
        return Invoice.model_validate(invoice)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/invoices/{invoice_id}/payment", response_model=Invoice)
async def record_invoice_payment(
    invoice_id: str,
    data: PaymentCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Registra pagamento de fatura."""
    try:
        # Cria pagamento
        await payment_service.create(db, data, current_user["user_id"], invoice_id=invoice_id)
        
        # Atualiza fatura
        invoice = await invoice_service.register_payment(
            db, invoice_id, current_user["user_id"], data.amount
        )
        
        return Invoice.model_validate(invoice)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Deleta uma fatura."""
    success = await invoice_service.delete(db, invoice_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")


# ==================== PAGAMENTOS ====================

@router.get("/payments", response_model=List[Payment])
async def list_payments(
    fee_id: Optional[str] = None,
    invoice_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista pagamentos."""
    payments = await payment_service.list(db, current_user["user_id"], limit=limit)
    
    if fee_id:
        payments = [p for p in payments if p.fee_id == fee_id]
    if invoice_id:
        payments = [p for p in payments if p.invoice_id == invoice_id]
    
    return [Payment.model_validate(p) for p in payments]


@router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtém detalhes de um pagamento."""
    payment = await payment_service.get(db, payment_id, current_user["user_id"])
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return Payment.model_validate(payment)
