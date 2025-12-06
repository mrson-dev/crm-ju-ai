"""
Modelos SQLAlchemy (ORM) para Cloud SQL PostgreSQL.

Estes modelos representam as tabelas do banco de dados e substituem
o antigo sistema baseado em Firestore.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.core.database import Base


def generate_uuid():
    """Gera um UUID para usar como ID"""
    return str(uuid.uuid4())


# ============================================================
# ENUMS
# ============================================================

class CaseStatusEnum(str, enum.Enum):
    NOVO = "novo"
    EM_ANDAMENTO = "em_andamento"
    AGUARDANDO = "aguardando"
    CONCLUIDO = "concluido"
    ARQUIVADO = "arquivado"


class CasePriorityEnum(str, enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class ClientTypeEnum(str, enum.Enum):
    PESSOA_FISICA = "pessoa_fisica"
    PESSOA_JURIDICA = "pessoa_juridica"


class MaritalStatusEnum(str, enum.Enum):
    SOLTEIRO = "solteiro"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUVO = "viuvo"
    SEPARADO = "separado"
    UNIAO_ESTAVEL = "uniao_estavel"


class GuardianRelationshipEnum(str, enum.Enum):
    PAI = "pai"
    MAE = "mae"
    AVO = "avo"
    TUTOR = "tutor"
    CURADOR = "curador"
    OUTRO = "outro"


class TemplateCategoryEnum(str, enum.Enum):
    PETICAO = "peticao"
    CONTRATO = "contrato"
    PROCURACAO = "procuracao"
    ATA = "ata"
    PARECER = "parecer"
    DECLARACAO = "declaracao"
    REQUERIMENTO = "requerimento"
    OUTRO = "outro"


class TaskStatusEnum(str, enum.Enum):
    PENDENTE = "pendente"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class TaskPriorityEnum(str, enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class TaskTypeEnum(str, enum.Enum):
    AUDIENCIA = "audiencia"
    PETICAO = "peticao"
    PRAZO_FATAL = "prazo_fatal"
    PRAZO_COMUM = "prazo_comum"
    REUNIAO = "reuniao"
    DILIGENCIA = "diligencia"
    ANALISE = "analise"
    CONTATO_CLIENTE = "contato_cliente"
    ADMINISTRATIVO = "administrativo"
    OUTRO = "outro"


class FeeTypeEnum(str, enum.Enum):
    FIXED = "fixed"
    HOURLY = "hourly"
    SUCCESS = "success"
    CONTINGENCY = "contingency"


class FeeStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class ExpenseCategoryEnum(str, enum.Enum):
    CUSTAS = "custas"
    VIAGEM = "viagem"
    COPIA = "copia"
    CARTORIO = "cartorio"
    PERITO = "perito"
    CORREIO = "correio"
    OUTROS = "outros"


class ExpenseStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REIMBURSED = "reimbursed"
    REJECTED = "rejected"


class InvoiceStatusEnum(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethodEnum(str, enum.Enum):
    PIX = "pix"
    BOLETO = "boleto"
    CARTAO = "cartao"
    TRANSFERENCIA = "transferencia"
    DINHEIRO = "dinheiro"


# ============================================================
# MODELOS - CLIENTES
# ============================================================

class Client(Base):
    """Modelo de Cliente no banco de dados."""
    __tablename__ = "clients"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Identificação básica
    name = Column(String(200), nullable=False, index=True)
    cpf_cnpj = Column(String(18), nullable=False, unique=True, index=True)
    client_type = Column(Enum(ClientTypeEnum), nullable=False, default=ClientTypeEnum.PESSOA_FISICA)
    
    # Dados pessoais
    birth_date = Column(String(10), nullable=True)  # DD/MM/AAAA
    nationality = Column(String(50), default="Brasileiro(a)")
    birth_place = Column(String(100), nullable=True)
    marital_status = Column(Enum(MaritalStatusEnum), nullable=True)
    profession = Column(String(100), nullable=True)
    mothers_name = Column(String(200), nullable=True)
    fathers_name = Column(String(200), nullable=True)
    
    # Contato
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(16), nullable=False)
    secondary_phone = Column(String(16), nullable=True)
    
    # Documentos (JSON)
    documents = Column(JSON, nullable=True)  # {rg, rg_issuer, rg_uf, ctps, pis_pasep, etc}
    
    # Endereço (JSON)
    address = Column(JSON, nullable=True)  # {cep, street, number, complement, neighborhood, city, uf}
    
    # Responsável Legal (JSON)
    is_minor = Column(Boolean, default=False)
    guardian = Column(JSON, nullable=True)  # {name, cpf, rg, phone, email, relationship}
    
    # LGPD
    lgpd_consent = Column(Boolean, default=False)
    lgpd_consent_date = Column(DateTime(timezone=True), nullable=True)
    
    # Observações
    notes = Column(Text, nullable=True)
    
    # Relacionamentos
    cases = relationship("Case", back_populates="client", cascade="all, delete-orphan")


# ============================================================
# MODELOS - PROCESSOS/CASOS
# ============================================================

class Case(Base):
    """Modelo de Processo/Caso Jurídico."""
    __tablename__ = "cases"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    client_id = Column(String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados do processo
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    case_number = Column(String(50), nullable=True, index=True)
    status = Column(Enum(CaseStatusEnum), nullable=False, default=CaseStatusEnum.NOVO, index=True)
    priority = Column(Enum(CasePriorityEnum), nullable=False, default=CasePriorityEnum.MEDIA)
    court = Column(String(200), nullable=True)
    tags = Column(JSON, default=list)  # Lista de tags
    
    # Relacionamentos
    client = relationship("Client", back_populates="cases")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="case", cascade="all, delete-orphan")


# ============================================================
# MODELOS - DOCUMENTOS
# ============================================================

class Document(Base):
    """Modelo de Documento anexado a um processo."""
    __tablename__ = "documents"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados do documento
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)  # Path no Cloud Storage
    file_url = Column(String(500), nullable=True)  # URL pública (se aplicável)
    file_size = Column(Integer, nullable=True)  # Tamanho em bytes
    mime_type = Column(String(100), nullable=True)
    
    # Relacionamento
    case = relationship("Case", back_populates="documents")


# ============================================================
# MODELOS - TEMPLATES
# ============================================================

class Template(Base):
    """Modelo de Template de Documento."""
    __tablename__ = "templates"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados do template
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(Enum(TemplateCategoryEnum), nullable=False, index=True)
    content = Column(Text, nullable=False)  # Conteúdo HTML/Markdown
    variables = Column(JSON, default=list)  # Lista de variáveis disponíveis
    is_public = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)


# ============================================================
# MODELOS - TIMESHEET (Controle de Horas)
# ============================================================

class TimeEntry(Base):
    """Modelo de Registro de Tempo (Timesheet)."""
    __tablename__ = "time_entries"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados do registro
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    duration = Column(Integer, nullable=False)  # Duração em minutos
    description = Column(Text, nullable=False)
    billable = Column(Boolean, default=True)
    hourly_rate = Column(Integer, nullable=True)  # Taxa por hora em centavos
    
    # Relacionamento
    case = relationship("Case", back_populates="time_entries")


# ============================================================
# MODELOS - AUTOMAÇÃO DE DOCUMENTOS
# ============================================================

class DocumentAutomation(Base):
    """Modelo de Automação de Documentos gerados."""
    __tablename__ = "document_automations"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados da automação
    name = Column(String(255), nullable=False)
    template_id = Column(String(36), nullable=False)  # Referência ao template usado
    case_id = Column(String(36), nullable=True)  # Caso associado (opcional)
    client_id = Column(String(36), nullable=True)  # Cliente associado (opcional)
    
    # Dados do documento gerado
    file_path = Column(String(500), nullable=False)  # Path no Cloud Storage
    file_url = Column(String(500), nullable=True)
    variables_used = Column(JSON, nullable=True)  # Variáveis que foram substituídas
    
    # Status
    status = Column(String(50), default="generated")  # generated, sent, signed, etc


# ============================================================
# MODELOS - TAREFAS
# ============================================================

class Task(Base):
    """Modelo de Tarefa com sistema Taskscore."""
    __tablename__ = "tasks"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados da tarefa
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(Enum(TaskTypeEnum), nullable=False, index=True)
    priority = Column(Enum(TaskPriorityEnum), nullable=False, default=TaskPriorityEnum.MEDIA, index=True)
    status = Column(Enum(TaskStatusEnum), nullable=False, default=TaskStatusEnum.PENDENTE, index=True)
    
    # Relacionamentos opcionais
    case_id = Column(String(36), nullable=True, index=True)
    client_id = Column(String(36), nullable=True, index=True)
    
    # Datas
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Gamificação (Taskscore)
    score = Column(Integer, default=0)  # Pontuação da tarefa
    completed_by = Column(String(128), nullable=True)  # Quem completou
    alert_level = Column(String(20), default="normal")  # normal, attention, warning, critical, fatal, overdue
    
    # Outros
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)


# ============================================================
# MODELOS - FINANCEIRO
# ============================================================

class Fee(Base):
    """Modelo de Honorário."""
    __tablename__ = "fees"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    case_id = Column(String(36), nullable=True, index=True)
    client_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados do honorário
    fee_type = Column(Enum(FeeTypeEnum), nullable=False)
    amount = Column(Integer, nullable=False)  # Em centavos
    amount_paid = Column(Integer, default=0)  # Em centavos
    amount_pending = Column(Integer, nullable=False)  # Em centavos
    description = Column(Text, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    # Parcelamento
    installments = Column(Integer, default=1)
    installments_paid = Column(Integer, default=0)
    installment_details = Column(JSON, nullable=True)  # Lista de parcelas
    
    # Status
    status = Column(Enum(FeeStatusEnum), nullable=False, default=FeeStatusEnum.PENDING, index=True)
    created_by = Column(String(128), nullable=True)


class Expense(Base):
    """Modelo de Despesa."""
    __tablename__ = "expenses"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    case_id = Column(String(36), nullable=True, index=True)
    client_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados da despesa
    category = Column(Enum(ExpenseCategoryEnum), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Em centavos
    description = Column(Text, nullable=False)
    expense_date = Column(DateTime(timezone=True), nullable=False, index=True)
    reimbursable = Column(Boolean, default=True)
    receipt_url = Column(String(500), nullable=True)
    
    # Status
    status = Column(Enum(ExpenseStatusEnum), nullable=False, default=ExpenseStatusEnum.PENDING, index=True)
    approved_by = Column(String(128), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)


class Invoice(Base):
    """Modelo de Fatura."""
    __tablename__ = "invoices"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    client_id = Column(String(36), nullable=False, index=True)
    case_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Dados da fatura
    invoice_number = Column(String(50), nullable=True, unique=True, index=True)
    items = Column(JSON, nullable=False)  # Lista de itens [{description, quantity, unit_price, item_type}]
    total_amount = Column(Integer, nullable=False)  # Em centavos
    amount_paid = Column(Integer, default=0)  # Em centavos
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Status
    status = Column(Enum(InvoiceStatusEnum), nullable=False, default=InvoiceStatusEnum.DRAFT, index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class Payment(Base):
    """Modelo de Pagamento."""
    __tablename__ = "payments"
    
    # IDs e timestamps
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(128), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relacionamentos
    fee_id = Column(String(36), nullable=True, index=True)
    invoice_id = Column(String(36), nullable=True, index=True)
    
    # Dados do pagamento
    amount = Column(Integer, nullable=False)  # Em centavos
    payment_method = Column(Enum(PaymentMethodEnum), nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False, index=True)
    installment_number = Column(Integer, nullable=True)
    
    # Observações
    notes = Column(Text, nullable=True)

