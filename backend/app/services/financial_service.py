"""
Serviço de Controle Financeiro para escritórios de advocacia.
Gerencia honorários, despesas, faturas e relatórios financeiros com Cloud SQL.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import logging

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import (
    Fee as DBFee,
    Expense as DBExpense,
    Invoice as DBInvoice,
    Payment as DBPayment
)
from app.models.schemas import (
    FeeCreate, ExpenseCreate, InvoiceCreate, PaymentCreate,
    FeeStatus, ExpenseStatus, InvoiceStatus
)
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


# ============================================================
# FEE SERVICE - Honorários
# ============================================================

class FeeService(BaseSQLService[DBFee, FeeCreate, dict]):
    """Serviço para gestão de honorários."""
    
    model = DBFee
    
    def _generate_installments(
        self, 
        total_amount: float, 
        num_installments: int, 
        start_date: Optional[datetime]
    ) -> List[Dict]:
        """Gera detalhes das parcelas."""
        installment_value = round(total_amount / num_installments, 2)
        remainder = round(total_amount - (installment_value * num_installments), 2)
        
        if start_date:
            base_date = start_date
        else:
            base_date = datetime.now(timezone.utc)
        
        installments = []
        for i in range(num_installments):
            due = base_date + timedelta(days=30 * i)
            value = installment_value
            if i == num_installments - 1:
                value += remainder  # Adiciona resto na última parcela
            
            installments.append({
                "number": i + 1,
                "value": value,
                "due_date": due.isoformat(),
                "status": "pending"
            })
        
        return installments
    
    async def create(
        self,
        db: AsyncSession,
        data: FeeCreate | dict,
        user_id: str,
        **extra_fields
    ) -> DBFee:
        """Cria honorário com cálculo de parcelas."""
        # Converte valores de reais para centavos
        if isinstance(data, FeeCreate):
            amount_cents = int(data.amount * 100)
            fee_dict = data.model_dump(exclude_unset=True)
        else:
            amount_cents = int(data.get("amount", 0) * 100)
            fee_dict = dict(data)
        
        fee_dict["amount"] = amount_cents
        fee_dict["amount_pending"] = amount_cents
        
        # Gera parcelas se necessário
        if fee_dict.get("installments", 1) > 1:
            installments_data = self._generate_installments(
                fee_dict["amount"] / 100,  # Volta para reais
                fee_dict["installments"],
                fee_dict.get("due_date")
            )
            fee_dict["installment_details"] = installments_data
        
        return await super().create(db, fee_dict, user_id, **extra_fields)
    
    async def register_payment(
        self,
        db: AsyncSession,
        fee_id: str,
        user_id: str,
        payment_data: Dict[str, Any]
    ) -> DBFee:
        """Registra pagamento de honorário."""
        fee = await self.get(db, fee_id, user_id)
        if not fee:
            raise ValueError(f"Honorário {fee_id} não encontrado")
        
        amount_cents = int(payment_data["amount"] * 100)
        
        # Atualiza valores
        fee.amount_paid += amount_cents
        fee.amount_pending = fee.amount - fee.amount_paid
        
        # Atualiza status
        if fee.amount_pending == 0:
            fee.status = FeeStatus.PAID
        elif fee.amount_paid > 0:
            fee.status = FeeStatus.PARTIAL
        
        # Atualiza parcelas se houver
        if fee.installment_details and payment_data.get("installment_number"):
            installment_num = payment_data["installment_number"] - 1
            if 0 <= installment_num < len(fee.installment_details):
                fee.installment_details[installment_num]["status"] = "paid"
                fee.installments_paid += 1
                fee.installment_details = list(fee.installment_details)  # Force update
        
        await db.commit()
        await db.refresh(fee)
        
        logger.info(f"Pagamento de R$ {payment_data['amount']} registrado para honorário {fee_id}")
        return fee
    
    async def list_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        client_id: Optional[str] = None,
        case_id: Optional[str] = None,
        status: Optional[FeeStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBFee]:
        """
        Lista honorários com filtros aplicados no SQL.
        
        Evita carregar todos os registros e filtrar em memória.
        """
        query = select(DBFee).where(DBFee.user_id == user_id)
        
        if client_id:
            query = query.where(DBFee.client_id == client_id)
        if case_id:
            query = query.where(DBFee.case_id == case_id)
        if status:
            query = query.where(DBFee.status == status)
        
        query = query.order_by(DBFee.created_at.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def count_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        client_id: Optional[str] = None,
        case_id: Optional[str] = None,
        status: Optional[FeeStatus] = None
    ) -> int:
        """
        Conta honorários com filtros aplicados no SQL.
        
        Mais eficiente que len(list_with_filters()).
        """
        query = select(func.count()).select_from(DBFee).where(DBFee.user_id == user_id)
        
        if client_id:
            query = query.where(DBFee.client_id == client_id)
        if case_id:
            query = query.where(DBFee.case_id == case_id)
        if status:
            query = query.where(DBFee.status == status)
        
        result = await db.execute(query)
        return result.scalar() or 0


# ============================================================
# EXPENSE SERVICE - Despesas
# ============================================================

class ExpenseService(BaseSQLService[DBExpense, ExpenseCreate, dict]):
    """Serviço para gestão de despesas."""
    
    model = DBExpense
    
    async def create(
        self,
        db: AsyncSession,
        data: ExpenseCreate | dict,
        user_id: str,
        **extra_fields
    ) -> DBExpense:
        """Cria despesa convertendo valores para centavos."""
        if isinstance(data, ExpenseCreate):
            amount_cents = int(data.amount * 100)
            expense_dict = data.model_dump(exclude_unset=True)
        else:
            amount_cents = int(data.get("amount", 0) * 100)
            expense_dict = dict(data)
        
        expense_dict["amount"] = amount_cents
        
        return await super().create(db, expense_dict, user_id, **extra_fields)
    
    async def approve(
        self,
        db: AsyncSession,
        expense_id: str,
        user_id: str,
        approved_by: str,
        notes: Optional[str] = None
    ) -> DBExpense:
        """Aprova uma despesa."""
        expense = await self.get(db, expense_id, user_id)
        if not expense:
            raise ValueError(f"Despesa {expense_id} não encontrada")
        
        expense.status = ExpenseStatus.APPROVED
        expense.approved_by = approved_by
        expense.approved_at = datetime.now(timezone.utc)
        if notes:
            expense.notes = notes
        
        await db.commit()
        await db.refresh(expense)
        
        logger.info(f"Despesa {expense_id} aprovada por {approved_by}")
        return expense
    
    async def list_by_status(
        self,
        db: AsyncSession,
        user_id: str,
        status: ExpenseStatus,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBExpense]:
        """Lista despesas por status."""
        query = (
            select(DBExpense)
            .where(DBExpense.user_id == user_id)
            .where(DBExpense.status == status)
            .order_by(DBExpense.expense_date.desc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def list_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        status: Optional[ExpenseStatus] = None,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBExpense]:
        """Lista despesas com filtros aplicados no SQL."""
        query = select(DBExpense).where(DBExpense.user_id == user_id)
        
        if status:
            query = query.where(DBExpense.status == status)
        if category:
            query = query.where(DBExpense.category == category)
        
        query = query.order_by(DBExpense.expense_date.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def count_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        status: Optional[ExpenseStatus] = None,
        category: Optional[str] = None
    ) -> int:
        """Conta despesas com filtros aplicados no SQL."""
        query = select(func.count()).select_from(DBExpense).where(DBExpense.user_id == user_id)
        
        if status:
            query = query.where(DBExpense.status == status)
        if category:
            query = query.where(DBExpense.category == category)
        
        result = await db.execute(query)
        return result.scalar() or 0


# ============================================================
# INVOICE SERVICE - Faturas
# ============================================================

class InvoiceService(BaseSQLService[DBInvoice, InvoiceCreate, dict]):
    """Serviço para gestão de faturas."""
    
    model = DBInvoice
    
    async def create(
        self,
        db: AsyncSession,
        data: InvoiceCreate | dict,
        user_id: str,
        **extra_fields
    ) -> DBInvoice:
        """Cria fatura calculando total."""
        if isinstance(data, InvoiceCreate):
            invoice_dict = data.model_dump(exclude_unset=True)
        else:
            invoice_dict = dict(data)
        
        # Calcula total
        total = 0
        for item in invoice_dict.get("items", []):
            total += item["quantity"] * item["unit_price"]
        
        invoice_dict["total_amount"] = int(total * 100)  # Centavos
        
        # Gera número da fatura
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{user_id[:8]}"
        invoice_dict["invoice_number"] = invoice_number
        
        return await super().create(db, invoice_dict, user_id, **extra_fields)
    
    async def mark_as_sent(
        self,
        db: AsyncSession,
        invoice_id: str,
        user_id: str
    ) -> DBInvoice:
        """Marca fatura como enviada."""
        invoice = await self.get(db, invoice_id, user_id)
        if not invoice:
            raise ValueError(f"Fatura {invoice_id} não encontrada")
        
        invoice.status = InvoiceStatus.SENT
        invoice.sent_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(invoice)
        
        logger.info(f"Fatura {invoice_id} marcada como enviada")
        return invoice
    
    async def register_payment(
        self,
        db: AsyncSession,
        invoice_id: str,
        user_id: str,
        amount: float
    ) -> DBInvoice:
        """Registra pagamento de fatura."""
        invoice = await self.get(db, invoice_id, user_id)
        if not invoice:
            raise ValueError(f"Fatura {invoice_id} não encontrada")
        
        amount_cents = int(amount * 100)
        invoice.amount_paid += amount_cents
        
        if invoice.amount_paid >= invoice.total_amount:
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(invoice)
        
        logger.info(f"Pagamento de R$ {amount} registrado para fatura {invoice_id}")
        return invoice
    
    async def list_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        client_id: Optional[str] = None,
        status: Optional[InvoiceStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DBInvoice]:
        """Lista faturas com filtros aplicados no SQL."""
        query = select(DBInvoice).where(DBInvoice.user_id == user_id)
        
        if client_id:
            query = query.where(DBInvoice.client_id == client_id)
        if status:
            query = query.where(DBInvoice.status == status)
        
        query = query.order_by(DBInvoice.issue_date.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def count_with_filters(
        self,
        db: AsyncSession,
        user_id: str,
        client_id: Optional[str] = None,
        status: Optional[InvoiceStatus] = None
    ) -> int:
        """Conta faturas com filtros aplicados no SQL."""
        query = select(func.count()).select_from(DBInvoice).where(DBInvoice.user_id == user_id)
        
        if client_id:
            query = query.where(DBInvoice.client_id == client_id)
        if status:
            query = query.where(DBInvoice.status == status)
        
        result = await db.execute(query)
        return result.scalar() or 0


# ============================================================
# PAYMENT SERVICE - Pagamentos
# ============================================================

class PaymentService(BaseSQLService[DBPayment, PaymentCreate, dict]):
    """Serviço para gestão de pagamentos."""
    
    model = DBPayment
    
    async def create(
        self,
        db: AsyncSession,
        data: PaymentCreate | dict,
        user_id: str,
        **extra_fields
    ) -> DBPayment:
        """Cria pagamento convertendo valores para centavos."""
        if isinstance(data, PaymentCreate):
            amount_cents = int(data.amount * 100)
            payment_dict = data.model_dump(exclude_unset=True)
        else:
            amount_cents = int(data.get("amount", 0) * 100)
            payment_dict = dict(data)
        
        payment_dict["amount"] = amount_cents
        
        return await super().create(db, payment_dict, user_id, **extra_fields)


# ============================================================
# SINGLETONS
# ============================================================

fee_service = FeeService()
expense_service = ExpenseService()
invoice_service = InvoiceService()
payment_service = PaymentService()
