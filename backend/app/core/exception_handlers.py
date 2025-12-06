"""
Exception handlers globais para FastAPI.

Converte exceções customizadas em respostas HTTP apropriadas.
"""

import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import (
    CRMBaseException,
    ResourceNotFoundError,
    AuthorizationError,
    AuthenticationError,
    ValidationError,
    DuplicateResourceError,
    ExternalServiceError,
    FileTooLargeError,
    UnsupportedFileTypeError,
    RateLimitError,
    BusinessRuleError,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: dict = None
) -> JSONResponse:
    """Cria resposta de erro padronizada."""
    content = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    
    # Em desenvolvimento, inclui detalhes
    if settings.ENVIRONMENT != "production" and details:
        content["error"]["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=content
    )


async def crm_exception_handler(request: Request, exc: CRMBaseException):
    """Handler para exceções customizadas do CRM."""
    
    # Mapear exceção para status code
    status_map = {
        ResourceNotFoundError: status.HTTP_404_NOT_FOUND,
        AuthorizationError: status.HTTP_403_FORBIDDEN,
        AuthenticationError: status.HTTP_401_UNAUTHORIZED,
        ValidationError: status.HTTP_422_UNPROCESSABLE_ENTITY,
        DuplicateResourceError: status.HTTP_409_CONFLICT,
        FileTooLargeError: status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        UnsupportedFileTypeError: status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        RateLimitError: status.HTTP_429_TOO_MANY_REQUESTS,
        BusinessRuleError: status.HTTP_400_BAD_REQUEST,
        ExternalServiceError: status.HTTP_502_BAD_GATEWAY,
    }
    
    status_code = status_map.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Log baseado na severidade
    if status_code >= 500:
        logger.error(f"Server error: {exc.code} - {exc.message}", extra=exc.details)
    elif status_code >= 400:
        logger.warning(f"Client error: {exc.code} - {exc.message}")
    
    return create_error_response(
        status_code=status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação do Pydantic/FastAPI."""
    
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Dados inválidos na requisição",
        details={"errors": errors}
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """Handler para exceções não tratadas."""
    
    logger.exception(f"Unhandled exception: {exc}")
    
    # Em produção, não expor detalhes do erro
    if settings.ENVIRONMENT == "production":
        message = "Ocorreu um erro interno. Tente novamente mais tarde."
        details = None
    else:
        message = str(exc)
        details = {"type": type(exc).__name__}
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_ERROR",
        message=message,
        details=details
    )


def register_exception_handlers(app):
    """Registra todos os exception handlers na aplicação FastAPI."""
    
    # Handlers específicos
    app.add_exception_handler(CRMBaseException, crm_exception_handler)
    app.add_exception_handler(ResourceNotFoundError, crm_exception_handler)
    app.add_exception_handler(AuthorizationError, crm_exception_handler)
    app.add_exception_handler(AuthenticationError, crm_exception_handler)
    app.add_exception_handler(ValidationError, crm_exception_handler)
    app.add_exception_handler(DuplicateResourceError, crm_exception_handler)
    app.add_exception_handler(ExternalServiceError, crm_exception_handler)
    app.add_exception_handler(FileTooLargeError, crm_exception_handler)
    app.add_exception_handler(UnsupportedFileTypeError, crm_exception_handler)
    app.add_exception_handler(RateLimitError, crm_exception_handler)
    app.add_exception_handler(BusinessRuleError, crm_exception_handler)
    
    # Handlers genéricos
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
