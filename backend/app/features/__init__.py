"""
Features do sistema organizadas por domínio.

Cada feature é um módulo independente que agrupa:
- Services relacionados
- Schemas (Pydantic)
- Lógica de negócio específica

Importar features ao invés de services/schemas individuais
promove melhor organização e encapsulamento.
"""

# Clientes
from app.features.clients import (
    client_service,
    Client,
    ClientCreate,
    ClientUpdate,
)

# Processos/Casos
from app.features.cases import (
    case_service,
    Case,
    CaseCreate,
    CaseUpdate,
    CaseStatus,
    CasePriority,
)

# Sistema Financeiro
from app.features.financial import (
    fee_service,
    expense_service,
    invoice_service,
    payment_service,
    Fee,
    FeeCreate,
    Expense,
    ExpenseCreate,
    Invoice,
    InvoiceCreate,
    Payment,
    PaymentCreate,
)

# Documentos
from app.features.documents import (
    document_service,
    document_automation_service,
    Document,
    DocumentCreate,
)

# Tarefas
from app.features.tasks import (
    task_service,
    Task,
    TaskCreate,
    TaskUpdate,
)

# Templates
from app.features.templates import (
    template_service,
    Template,
    TemplateCreate,
    TemplateUpdate,
)

# Timesheet
from app.features.timesheet import (
    timesheet_service,
    TimeEntry,
    TimeEntryCreate,
    TimeEntryUpdate,
)

__all__ = [
    # Clientes
    'client_service',
    'Client',
    'ClientCreate',
    'ClientUpdate',
    # Casos
    'case_service',
    'Case',
    'CaseCreate',
    'CaseUpdate',
    'CaseStatus',
    'CasePriority',
    # Financeiro
    'fee_service',
    'expense_service',
    'invoice_service',
    'payment_service',
    'Fee',
    'FeeCreate',
    'Expense',
    'ExpenseCreate',
    'Invoice',
    'InvoiceCreate',
    'Payment',
    'PaymentCreate',
    # Documentos
    'document_service',
    'document_automation_service',
    'Document',
    'DocumentCreate',
    # Tarefas
    'task_service',
    'Task',
    'TaskCreate',
    'TaskUpdate',
    # Templates
    'template_service',
    'Template',
    'TemplateCreate',
    'TemplateUpdate',
    # Timesheet
    'timesheet_service',
    'TimeEntry',
    'TimeEntryCreate',
    'TimeEntryUpdate',
]
