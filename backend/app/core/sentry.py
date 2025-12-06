"""
Integração com Sentry para monitoramento de erros e performance.
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from app.core.config import settings


def init_sentry():
    """Inicializa o Sentry se DSN estiver configurado."""
    if not settings.SENTRY_DSN:
        logging.info("Sentry DSN not configured. Skipping Sentry initialization.")
        return
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=0.5,  # 50% dos traces terão profiling
        
        # Integrações
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",  # Usa endpoint como nome da transação
                failed_request_status_codes=[500, 501, 502, 503, 504],
            ),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=logging.INFO,  # Captura logs INFO+
                event_level=logging.ERROR,  # Envia apenas ERROR+ para Sentry
            ),
        ],
        
        # Filtros de dados sensíveis
        before_send=before_send_filter,
        before_send_transaction=before_send_transaction_filter,
        
        # Performance
        enable_tracing=True,
        _experiments={
            "profiles_sample_rate": 0.5,
        },
    )
    
    logging.info(f"Sentry initialized for environment: {settings.SENTRY_ENVIRONMENT}")


def before_send_filter(event, hint):
    """
    Filtra dados sensíveis antes de enviar para Sentry.
    """
    # Remove dados de autenticação
    if "request" in event:
        headers = event["request"].get("headers", {})
        if "Authorization" in headers:
            headers["Authorization"] = "[Filtered]"
        if "Cookie" in headers:
            headers["Cookie"] = "[Filtered]"
    
    # Remove dados sensíveis de formulários
    if "request" in event and "data" in event["request"]:
        data = event["request"]["data"]
        sensitive_fields = ["password", "token", "secret", "cpf", "rg"]
        
        if isinstance(data, dict):
            for field in sensitive_fields:
                if field in data:
                    data[field] = "[Filtered]"
    
    return event


def before_send_transaction_filter(event, hint):
    """
    Filtra transações antes de enviar para Sentry.
    Remove transações de health check para reduzir volume.
    """
    if event.get("transaction") == "/health":
        return None
    
    return event
