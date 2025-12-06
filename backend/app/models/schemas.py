from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

from app.core.validators import (
    validate_cpf_cnpj, 
    validate_phone, 
    format_cpf_cnpj, 
    format_phone
)


# Enums
class CaseStatus(str, Enum):
    NOVO = "novo"
    EM_ANDAMENTO = "em_andamento"
    AGUARDANDO = "aguardando"
    CONCLUIDO = "concluido"
    ARQUIVADO = "arquivado"


class CasePriority(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class ClientType(str, Enum):
    PESSOA_FISICA = "pessoa_fisica"
    PESSOA_JURIDICA = "pessoa_juridica"


class BrazilianState(str, Enum):
    """Estados brasileiros."""
    AC = "AC"
    AL = "AL"
    AP = "AP"
    AM = "AM"
    BA = "BA"
    CE = "CE"
    DF = "DF"
    ES = "ES"
    GO = "GO"
    MA = "MA"
    MT = "MT"
    MS = "MS"
    MG = "MG"
    PA = "PA"
    PB = "PB"
    PR = "PR"
    PE = "PE"
    PI = "PI"
    RJ = "RJ"
    RN = "RN"
    RS = "RS"
    RO = "RO"
    RR = "RR"
    SC = "SC"
    SP = "SP"
    SE = "SE"
    TO = "TO"


class MaritalStatus(str, Enum):
    """Estado civil."""
    SOLTEIRO = "solteiro"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUVO = "viuvo"
    SEPARADO = "separado"
    UNIAO_ESTAVEL = "uniao_estavel"


class GuardianRelationship(str, Enum):
    """Relação do responsável legal."""
    PAI = "pai"
    MAE = "mae"
    AVO = "avo"
    TUTOR = "tutor"
    CURADOR = "curador"
    OUTRO = "outro"


# Base Models
class BaseDocument(BaseModel):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================================
# ADDRESS MODELS - Endereço completo
# ============================================================
class AddressModel(BaseModel):
    """Modelo de endereço completo."""
    cep: Optional[str] = Field(None, max_length=9, description="CEP no formato 00000-000")
    street: Optional[str] = Field(None, max_length=200, description="Logradouro")
    number: Optional[str] = Field(None, max_length=20, description="Número")
    complement: Optional[str] = Field(None, max_length=100, description="Complemento")
    neighborhood: Optional[str] = Field(None, max_length=100, description="Bairro")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    uf: Optional[str] = Field(None, max_length=2, description="UF")


# ============================================================
# GUARDIAN MODELS - Responsável Legal (para menores)
# ============================================================
class GuardianModel(BaseModel):
    """Modelo de responsável legal para menores de idade."""
    name: Optional[str] = Field(None, max_length=200, description="Nome do responsável")
    cpf: Optional[str] = Field(None, max_length=14, description="CPF do responsável")
    rg: Optional[str] = Field(None, max_length=20, description="RG do responsável")
    phone: Optional[str] = Field(None, max_length=16, description="Telefone do responsável")
    email: Optional[EmailStr] = Field(None, description="Email do responsável")
    relationship: Optional[GuardianRelationship] = Field(None, description="Relação com o cliente")


# ============================================================
# DOCUMENT INFO - Documentos adicionais (RG, CTPS, PIS)
# ============================================================
class DocumentInfoModel(BaseModel):
    """Informações de documentos do cliente."""
    rg: Optional[str] = Field(None, max_length=20, description="Número do RG")
    rg_issuer: Optional[str] = Field(None, max_length=20, description="Órgão emissor do RG")
    rg_uf: Optional[str] = Field(None, max_length=2, description="UF do RG")
    ctps: Optional[str] = Field(None, max_length=20, description="Número da CTPS")
    ctps_series: Optional[str] = Field(None, max_length=10, description="Série da CTPS")
    ctps_uf: Optional[str] = Field(None, max_length=2, description="UF da CTPS")
    pis_pasep: Optional[str] = Field(None, max_length=14, description="PIS/PASEP")


# ============================================================
# CLIENT MODELS - Modelo completo de cliente
# ============================================================
class ClientBase(BaseModel):
    """Modelo base de cliente com todos os campos."""
    
    # === Identificação básica ===
    name: str = Field(..., min_length=3, max_length=200, description="Nome completo")
    cpf_cnpj: str = Field(..., description="CPF ou CNPJ")
    client_type: ClientType = Field(ClientType.PESSOA_FISICA, description="Tipo de pessoa")
    
    # === Dados pessoais ===
    birth_date: Optional[str] = Field(None, description="Data de nascimento (DD/MM/AAAA)")
    nationality: Optional[str] = Field("Brasileiro(a)", max_length=50, description="Nacionalidade")
    birth_place: Optional[str] = Field(None, max_length=100, description="Naturalidade")
    marital_status: Optional[MaritalStatus] = Field(None, description="Estado civil")
    profession: Optional[str] = Field(None, max_length=100, description="Profissão")
    mothers_name: Optional[str] = Field(None, max_length=200, description="Nome da mãe")
    fathers_name: Optional[str] = Field(None, max_length=200, description="Nome do pai")
    
    # === Contato ===
    email: EmailStr = Field(..., description="Email de contato")
    phone: str = Field(..., description="Telefone com DDD")
    secondary_phone: Optional[str] = Field(None, description="Telefone secundário")
    
    # === Documentos (modelo aninhado) ===
    documents: Optional[DocumentInfoModel] = Field(None, description="Documentos adicionais")
    
    # === Endereço (modelo aninhado) ===
    address: Optional[AddressModel] = Field(None, description="Endereço completo")
    
    # === Responsável Legal (para menores) ===
    is_minor: bool = Field(False, description="Se o cliente é menor de idade")
    guardian: Optional[GuardianModel] = Field(None, description="Dados do responsável legal")
    
    # === LGPD ===
    lgpd_consent: bool = Field(False, description="Consentimento LGPD")
    lgpd_consent_date: Optional[datetime] = Field(None, description="Data do consentimento")
    
    # === Observações ===
    notes: Optional[str] = Field(None, max_length=2000, description="Observações gerais")
    
    @field_validator('cpf_cnpj', mode='before')
    @classmethod
    def validate_and_format_cpf_cnpj(cls, v: str) -> str:
        if not v:
            raise ValueError('CPF/CNPJ é obrigatório')
        if not validate_cpf_cnpj(v):
            raise ValueError('CPF ou CNPJ inválido')
        return format_cpf_cnpj(v)
    
    @field_validator('phone', mode='before')
    @classmethod
    def validate_and_format_phone(cls, v: str) -> str:
        if not v:
            raise ValueError('Telefone é obrigatório')
        if not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato (XX) XXXXX-XXXX')
        return format_phone(v)
    
    @field_validator('secondary_phone', mode='before')
    @classmethod
    def validate_secondary_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return None
        if not validate_phone(v):
            raise ValueError('Telefone secundário inválido. Use formato (XX) XXXXX-XXXX')
        return format_phone(v)


class ClientCreate(ClientBase):
    """Modelo para criação de cliente."""
    pass


class ClientUpdate(BaseModel):
    """Modelo para atualização de cliente - todos campos opcionais."""
    
    # === Identificação básica ===
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    client_type: Optional[ClientType] = None
    
    # === Dados pessoais ===
    birth_date: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=50)
    birth_place: Optional[str] = Field(None, max_length=100)
    marital_status: Optional[MaritalStatus] = None
    profession: Optional[str] = Field(None, max_length=100)
    mothers_name: Optional[str] = Field(None, max_length=200)
    fathers_name: Optional[str] = Field(None, max_length=200)
    
    # === Contato ===
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    
    # === Documentos ===
    documents: Optional[DocumentInfoModel] = None
    
    # === Endereço ===
    address: Optional[AddressModel] = None
    
    # === Responsável Legal ===
    is_minor: Optional[bool] = None
    guardian: Optional[GuardianModel] = None
    
    # === LGPD ===
    lgpd_consent: Optional[bool] = None
    lgpd_consent_date: Optional[datetime] = None
    
    # === Observações ===
    notes: Optional[str] = Field(None, max_length=2000)
    
    @field_validator('phone', mode='before')
    @classmethod
    def validate_and_format_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato (XX) XXXXX-XXXX')
        return format_phone(v)
    
    @field_validator('secondary_phone', mode='before')
    @classmethod
    def validate_secondary_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return None
        if not validate_phone(v):
            raise ValueError('Telefone secundário inválido. Use formato (XX) XXXXX-XXXX')
        return format_phone(v)


class Client(ClientBase, BaseDocument):
    """Modelo completo de cliente com metadados."""
    user_id: str


# Case Models
class CaseBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    client_id: str
    case_number: Optional[str] = Field(None, max_length=50)
    status: CaseStatus = CaseStatus.NOVO
    priority: CasePriority = CasePriority.MEDIA
    court: Optional[str] = None
    tags: List[str] = []

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    court: Optional[str] = None
    tags: Optional[List[str]] = None

class Case(CaseBase, BaseDocument):
    user_id: str

# Document Models
class DocumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    case_id: str
    file_type: str
    file_size: int
    storage_path: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase, BaseDocument):
    user_id: str
    download_url: Optional[str] = None

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    oab_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase, BaseDocument):
    is_active: bool = True
    firebase_uid: Optional[str] = None

# Template Models
class TemplateCategory(str, Enum):
    CONTRATO = "contrato"
    PROCURACAO = "procuracao"
    PETICAO = "peticao"
    ATA = "ata"
    DECLARACAO = "declaracao"
    OUTROS = "outros"

class TemplateBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: TemplateCategory
    content: str  # HTML content do editor
    description: Optional[str] = None
    placeholders: List[str] = []  # Lista de placeholders usados no template
    is_public: bool = False  # Se template é compartilhado entre usuários

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[TemplateCategory] = None
    content: Optional[str] = None
    description: Optional[str] = None
    placeholders: Optional[List[str]] = None
    is_public: Optional[bool] = None

class Template(TemplateBase, BaseDocument):
    user_id: str
    usage_count: int = 0  # Contador de uso

# Generated Document Models
class GeneratedDocumentBase(BaseModel):
    title: str
    template_id: str
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    content: str  # HTML final com placeholders preenchidos
    placeholders_data: Dict = {}  # Dados usados para preencher

class GeneratedDocumentCreate(GeneratedDocumentBase):
    pass

class GeneratedDocument(GeneratedDocumentBase, BaseDocument):
    user_id: str


# ==================== Task Models (Taskscore System) ====================

class TaskStatus(str, Enum):
    """Status possíveis de uma tarefa."""
    PENDENTE = "pendente"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class TaskPriority(str, Enum):
    """Prioridade da tarefa - afeta multiplicador do Taskscore."""
    BAIXA = "baixa"      # 0.8x
    MEDIA = "media"      # 1.0x
    ALTA = "alta"        # 1.3x
    URGENTE = "urgente"  # 1.5x


class TaskType(str, Enum):
    """
    Tipo de tarefa - determina pontuação base no Taskscore.
    
    Pontuações:
    - AUDIENCIA: 100 pts
    - PRAZO_FATAL: 90 pts
    - PETICAO: 80 pts
    - ANALISE: 70 pts
    - DILIGENCIA: 60 pts
    - PRAZO_COMUM: 50 pts
    - REUNIAO: 40 pts
    - CONTATO_CLIENTE: 30 pts
    - OUTRO: 25 pts
    - ADMINISTRATIVO: 20 pts
    """
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


class TaskBase(BaseModel):
    """Modelo base para tarefas."""
    title: str = Field(..., min_length=3, max_length=200, description="Título da tarefa")
    description: Optional[str] = Field(None, max_length=2000, description="Descrição detalhada")
    task_type: TaskType = Field(..., description="Tipo da tarefa (afeta pontuação)")
    priority: TaskPriority = Field(TaskPriority.MEDIA, description="Prioridade (afeta multiplicador)")
    status: TaskStatus = Field(TaskStatus.PENDENTE, description="Status atual")
    due_date: Optional[datetime] = Field(None, description="Data limite para conclusão")
    
    # Relacionamentos opcionais
    case_id: Optional[str] = Field(None, description="ID do caso relacionado")
    client_id: Optional[str] = Field(None, description="ID do cliente relacionado")
    
    # Atribuição
    assigned_to: Optional[str] = Field(None, description="ID do usuário responsável")
    
    # Campos adicionais
    notes: Optional[str] = Field(None, max_length=1000, description="Observações")
    tags: List[str] = Field(default_factory=list, description="Tags para organização")
    
    # Campos de localização (para audiências/reuniões)
    location: Optional[str] = Field(None, max_length=500, description="Local da tarefa")
    
    # Processo judicial relacionado
    process_number: Optional[str] = Field(None, max_length=50, description="Número do processo")


class TaskCreate(TaskBase):
    """Modelo para criação de tarefa."""
    pass


class TaskUpdate(BaseModel):
    """Modelo para atualização de tarefa."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    task_type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=1000)
    tags: Optional[List[str]] = None
    location: Optional[str] = Field(None, max_length=500)
    process_number: Optional[str] = Field(None, max_length=50)


class Task(TaskBase, BaseDocument):
    """
    Modelo completo de tarefa com campos de gamificação.
    
    O sistema Taskscore calcula automaticamente:
    - score: Pontuação base × multiplicador de prioridade
    - alert_level: Nível de alerta baseado no prazo
    """
    user_id: str
    
    # Campos de gamificação (Taskscore)
    score: int = Field(0, description="Pontuação da tarefa calculada automaticamente")
    alert_level: str = Field("normal", description="Nível de alerta: normal, attention, warning, critical, fatal, overdue")
    
    # Campos de conclusão
    completed_at: Optional[datetime] = Field(None, description="Data/hora de conclusão")
    completed_by: Optional[str] = Field(None, description="ID do usuário que concluiu")


# ============================================================
# TIMESHEET - CONTROLE DE TEMPO INTELIGENTE
# ============================================================

class TimeEntryBase(BaseModel):
    """
    Modelo base para entrada de tempo.
    Contém campos comuns para criação e atualização.
    """
    case_id: Optional[str] = Field(None, description="ID do caso associado")
    client_id: Optional[str] = Field(None, description="ID do cliente associado")
    description: str = Field(..., min_length=5, max_length=500, description="Descrição da atividade")
    
    # Controle de tempo
    duration_minutes: Optional[int] = Field(None, ge=0, description="Duração em minutos")
    start_time: Optional[datetime] = Field(None, description="Hora de início")
    end_time: Optional[datetime] = Field(None, description="Hora de término")
    
    # Faturamento
    is_billable: bool = Field(True, description="Se é faturável")
    billing_rate: Optional[float] = Field(None, ge=0, description="Taxa por hora (R$/hora)")
    
    # Categorização
    activity_type: str = Field("general", description="Tipo de atividade: hearing, meeting, research, document, call, email, travel, general")
    tags: List[str] = Field(default_factory=list, description="Tags para categorização")
    notes: Optional[str] = Field(None, max_length=1000, description="Notas adicionais")


class TimeEntryCreate(TimeEntryBase):
    """
    Schema para criação de entrada de tempo.
    Requer descrição e pelo menos duração ou tempos de início/fim.
    """
    pass


class TimeEntryUpdate(BaseModel):
    """
    Schema para atualização parcial de entrada de tempo.
    Todos os campos são opcionais.
    """
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = Field(None, min_length=5, max_length=500)
    duration_minutes: Optional[int] = Field(None, ge=0)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_billable: Optional[bool] = None
    billing_rate: Optional[float] = Field(None, ge=0)
    activity_type: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)


class TimeEntry(TimeEntryBase, BaseDocument):
    """
    Modelo completo de entrada de tempo com cálculos de faturamento.
    """
    user_id: str
    
    # Timer (para cronômetro ativo)
    is_timer_running: bool = Field(False, description="Se o timer está ativo")
    timer_started_at: Optional[datetime] = Field(None, description="Quando o timer foi iniciado")
    
    # Faturamento calculado
    total_amount: float = Field(0, description="Valor total (duração × taxa)")
    
    # Referências
    case_title: Optional[str] = Field(None, description="Título do caso (cache)")
    client_name: Optional[str] = Field(None, description="Nome do cliente (cache)")


# ============================================================
# FINANCIAL MODELS - Honorários, Despesas, Faturas
# ============================================================

class FeeType(str, Enum):
    FIXED = "fixed"
    HOURLY = "hourly"
    SUCCESS = "success"
    CONTINGENCY = "contingency"


class FeeStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class ExpenseCategory(str, Enum):
    CUSTAS = "custas"
    VIAGEM = "viagem"
    COPIA = "copia"
    CARTORIO = "cartorio"
    PERITO = "perito"
    CORREIO = "correio"
    OUTROS = "outros"


class ExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REIMBURSED = "reimbursed"
    REJECTED = "rejected"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    PIX = "pix"
    BOLETO = "boleto"
    CARTAO = "cartao"
    TRANSFERENCIA = "transferencia"
    DINHEIRO = "dinheiro"


class FeeBase(BaseModel):
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    fee_type: FeeType
    amount: float = Field(..., gt=0, description="Valor em reais")
    description: str = Field(..., min_length=5, max_length=500)
    due_date: Optional[datetime] = None
    installments: int = Field(1, ge=1, le=120)


class FeeCreate(FeeBase):
    pass


class Fee(FeeBase, BaseDocument):
    user_id: str
    amount_paid: float = 0
    amount_pending: float
    installments_paid: int = 0
    installment_details: Optional[List[Dict]] = None
    status: FeeStatus = FeeStatus.PENDING
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    category: ExpenseCategory
    amount: float = Field(..., gt=0, description="Valor em reais")
    description: str = Field(..., min_length=5, max_length=500)
    expense_date: datetime
    reimbursable: bool = True
    receipt_url: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase, BaseDocument):
    user_id: str
    status: ExpenseStatus = ExpenseStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = Field(1, gt=0)
    unit_price: float = Field(..., gt=0, description="Preço unitário em reais")
    item_type: str = Field("fee", description="fee ou expense")


class InvoiceBase(BaseModel):
    client_id: str
    case_id: Optional[str] = None
    items: List[InvoiceItemBase]
    due_date: datetime
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class Invoice(InvoiceBase, BaseDocument):
    user_id: str
    invoice_number: Optional[str] = None
    total_amount: float
    amount_paid: float = 0
    status: InvoiceStatus = InvoiceStatus.DRAFT
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    amount: float = Field(..., gt=0, description="Valor em reais")
    payment_method: PaymentMethod
    payment_date: datetime
    installment_number: Optional[int] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    fee_id: Optional[str] = None
    invoice_id: Optional[str] = None


class Payment(PaymentBase, BaseDocument):
    user_id: str
    fee_id: Optional[str] = None
    invoice_id: Optional[str] = None
    
    class Config:
        from_attributes = True
