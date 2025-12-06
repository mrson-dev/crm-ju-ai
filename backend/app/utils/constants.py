"""
Constantes do sistema.
"""

# Status
STATUS_ACTIVE = "active"
STATUS_INACTIVE = "inactive"
STATUS_PENDING = "pending"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"

# Prioridades
PRIORITY_LOW = "low"
PRIORITY_MEDIUM = "medium"
PRIORITY_HIGH = "high"
PRIORITY_URGENT = "urgent"

# Limites
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_PAGE_SIZE = 200
DEFAULT_PAGE_SIZE = 50
MAX_SEARCH_RESULTS = 100

# Cache TTL (segundos)
CACHE_TTL_SHORT = 60  # 1 minuto
CACHE_TTL_MEDIUM = 300  # 5 minutos
CACHE_TTL_LONG = 3600  # 1 hora
CACHE_TTL_DAY = 86400  # 24 horas

# Rate Limiting
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW_SECONDS = 60

# Timeouts
HTTP_TIMEOUT = 30
DB_TIMEOUT = 10
CACHE_TIMEOUT = 5

# Formatos de arquivo permitidos
ALLOWED_DOCUMENT_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
}

ALLOWED_IMAGE_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}

# Tipos MIME
MIME_TYPE_PDF = 'application/pdf'
MIME_TYPE_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
MIME_TYPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
MIME_TYPE_JSON = 'application/json'
MIME_TYPE_TEXT = 'text/plain'

# Extensões de arquivo
DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

# Mensagens padrão
MSG_NOT_FOUND = "Registro não encontrado"
MSG_UNAUTHORIZED = "Acesso não autorizado"
MSG_INVALID_DATA = "Dados inválidos"
MSG_SUCCESS = "Operação realizada com sucesso"
MSG_ERROR = "Erro ao processar requisição"

# Regex patterns
REGEX_CPF = r'^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$'
REGEX_CNPJ = r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$|^\d{14}$'
REGEX_PHONE = r'^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}-?[0-9]{4}$'
REGEX_CEP = r'^\d{5}-?\d{3}$'
REGEX_EMAIL = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# Estados brasileiros
BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

# Configurações de paginação
PAGINATION_CONFIG = {
    'default_page': 1,
    'default_page_size': DEFAULT_PAGE_SIZE,
    'max_page_size': MAX_PAGE_SIZE,
}

__all__ = [
    'STATUS_ACTIVE',
    'STATUS_INACTIVE',
    'STATUS_PENDING',
    'STATUS_COMPLETED',
    'STATUS_CANCELLED',
    'PRIORITY_LOW',
    'PRIORITY_MEDIUM',
    'PRIORITY_HIGH',
    'PRIORITY_URGENT',
    'MAX_FILE_SIZE_MB',
    'MAX_FILE_SIZE_BYTES',
    'MAX_PAGE_SIZE',
    'DEFAULT_PAGE_SIZE',
    'MAX_SEARCH_RESULTS',
    'CACHE_TTL_SHORT',
    'CACHE_TTL_MEDIUM',
    'CACHE_TTL_LONG',
    'CACHE_TTL_DAY',
    'RATE_LIMIT_REQUESTS',
    'RATE_LIMIT_WINDOW_SECONDS',
    'ALLOWED_DOCUMENT_TYPES',
    'ALLOWED_IMAGE_TYPES',
    'MIME_TYPE_PDF',
    'MIME_TYPE_DOCX',
    'MIME_TYPE_XLSX',
    'MIME_TYPE_JSON',
    'MIME_TYPE_TEXT',
    'DOCUMENT_EXTENSIONS',
    'IMAGE_EXTENSIONS',
    'MSG_NOT_FOUND',
    'MSG_UNAUTHORIZED',
    'MSG_INVALID_DATA',
    'MSG_SUCCESS',
    'MSG_ERROR',
    'REGEX_CPF',
    'REGEX_CNPJ',
    'REGEX_PHONE',
    'REGEX_CEP',
    'REGEX_EMAIL',
    'BRAZILIAN_STATES',
    'PAGINATION_CONFIG',
]
