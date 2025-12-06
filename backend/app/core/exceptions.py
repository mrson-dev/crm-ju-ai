"""
Módulo de Exceptions customizadas para o CRM Jurídico.

Define exceções específicas do domínio que permitem tratamento
de erros mais granular e mensagens mais claras para os usuários.
"""

from typing import Optional, Dict, Any


class CRMBaseException(Exception):
    """Exceção base para todas as exceções do CRM."""
    
    def __init__(
        self, 
        message: str, 
        code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ResourceNotFoundError(CRMBaseException):
    """Recurso não encontrado no sistema."""
    
    def __init__(
        self, 
        resource_type: str, 
        resource_id: str,
        message: Optional[str] = None
    ):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(
            message=message or f"{resource_type} com ID '{resource_id}' não encontrado",
            code="RESOURCE_NOT_FOUND",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id
            }
        )


class AuthorizationError(CRMBaseException):
    """Usuário não tem permissão para acessar o recurso."""
    
    def __init__(
        self, 
        message: str = "Você não tem permissão para acessar este recurso",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id
            }
        )


class AuthenticationError(CRMBaseException):
    """Erro de autenticação."""
    
    def __init__(self, message: str = "Token inválido ou expirado"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR"
        )


class ValidationError(CRMBaseException):
    """Erro de validação de dados."""
    
    def __init__(
        self, 
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            details={
                "field": field,
                "value": str(value) if value is not None else None
            }
        )


class DuplicateResourceError(CRMBaseException):
    """Recurso duplicado (violação de unicidade)."""
    
    def __init__(
        self, 
        resource_type: str,
        field: str,
        value: str
    ):
        super().__init__(
            message=f"{resource_type} com {field}='{value}' já existe",
            code="DUPLICATE_RESOURCE",
            details={
                "resource_type": resource_type,
                "field": field,
                "value": value
            }
        )


class ExternalServiceError(CRMBaseException):
    """Erro em serviço externo (Firebase, GCS, Vision API, etc)."""
    
    def __init__(
        self, 
        service_name: str,
        message: str,
        original_error: Optional[Exception] = None
    ):
        super().__init__(
            message=f"Erro no serviço {service_name}: {message}",
            code="EXTERNAL_SERVICE_ERROR",
            details={
                "service": service_name,
                "original_error": str(original_error) if original_error else None
            }
        )


class FileTooLargeError(CRMBaseException):
    """Arquivo excede o tamanho máximo permitido."""
    
    def __init__(
        self, 
        max_size_mb: int,
        actual_size_mb: float
    ):
        super().__init__(
            message=f"Arquivo muito grande. Máximo permitido: {max_size_mb}MB. Tamanho enviado: {actual_size_mb:.2f}MB",
            code="FILE_TOO_LARGE",
            details={
                "max_size_mb": max_size_mb,
                "actual_size_mb": actual_size_mb
            }
        )


class UnsupportedFileTypeError(CRMBaseException):
    """Tipo de arquivo não suportado."""
    
    def __init__(
        self, 
        file_type: str,
        supported_types: list
    ):
        super().__init__(
            message=f"Tipo de arquivo '{file_type}' não suportado. Tipos aceitos: {', '.join(supported_types)}",
            code="UNSUPPORTED_FILE_TYPE",
            details={
                "file_type": file_type,
                "supported_types": supported_types
            }
        )


class RateLimitError(CRMBaseException):
    """Limite de requisições excedido."""
    
    def __init__(
        self, 
        retry_after_seconds: int = 60
    ):
        super().__init__(
            message=f"Limite de requisições excedido. Tente novamente em {retry_after_seconds} segundos",
            code="RATE_LIMIT_EXCEEDED",
            details={
                "retry_after_seconds": retry_after_seconds
            }
        )


class BusinessRuleError(CRMBaseException):
    """Violação de regra de negócio."""
    
    def __init__(
        self, 
        rule: str,
        message: str
    ):
        super().__init__(
            message=message,
            code="BUSINESS_RULE_VIOLATION",
            details={
                "rule": rule
            }
        )
