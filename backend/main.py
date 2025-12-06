import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.core.config import settings
from app.core.sentry import init_sentry
from app.core.exception_handlers import register_exception_handlers
from app.core.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    AuditContextMiddleware
)
from app.core.rate_limiting import RateLimitingMiddleware
from app.core.compression import CompressionMiddleware, COMPRESSION_CONFIGS
from app.api.routes import api_router

# Inicializar Sentry
init_sentry()

# Configurar logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CRM Jurídico API",
    description="""
    ## API para Gerenciamento de CRM Jurídico com IA

    Sistema completo de gestão jurídica com recursos de:
    - 📋 Gestão de Clientes
    - ⚖️ Gestão de Processos
    - 📄 Gestão de Documentos
    - 💰 Gestão Financeira
    - ⏱️ Controle de Horas (Timesheet)
    - 🤖 Automação com IA

    ### Autenticação
    A API utiliza Firebase Authentication. Inclua o token JWT no header:
    ```
    Authorization: Bearer <seu-token>
    ```

    ### Rate Limiting
    - 60 requisições por minuto por IP (desenvolvimento)
    - 30 requisições por minuto por IP (produção)

    ### Ambientes
    - **Desenvolvimento**: Documentação completa disponível
    - **Produção**: Documentação restrita
    """,
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    contact={
        "name": "Equipe CRM Jurídico",
        "email": "contato@crmjuridico.com",
    },
    license_info={
        "name": "Proprietary",
    },
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "docExpansion": "none",
        "filter": True,
        "showExtensions": True,
        "syntaxHighlight.theme": "monokai",
    }
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Token JWT do Firebase Authentication"
        }
    }

    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Registrar exception handlers customizados
register_exception_handlers(app)

# Middlewares customizados (ordem importa - do mais externo ao mais interno)
app.add_middleware(AuditContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitingMiddleware)

# Compression (GZip) - Deve vir antes do CORS
compression_config = COMPRESSION_CONFIGS.get(settings.ENVIRONMENT, COMPRESSION_CONFIGS["production"])
app.add_middleware(CompressionMiddleware, **compression_config)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "CRM Jurídico API",
        "status": "running",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health():
    """
    Health check endpoint.

    Verifica conexão com dependências críticas.
    """
    from fastapi.responses import JSONResponse
    from sqlalchemy import text
    from app.core.redis_cache import redis_cache
    from app.core.database import get_async_db

    health_status = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "services": {}
    }

    try:
        async for db in get_async_db():
            await db.execute(text("SELECT 1"))
            health_status["services"]["database"] = "connected"
            break
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["services"]["database"] = f"error: {str(e)}"

    try:
        if redis_cache.is_connected:
            await redis_cache.redis.ping()
            health_status["services"]["redis"] = "connected"
        else:
            health_status["services"]["redis"] = "disconnected"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["services"]["redis"] = f"error: {str(e)}"

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.on_event("startup")
async def startup():
    """Inicialização da aplicação"""
    logger.info(f"Starting CRM Jurídico API - Environment: {settings.ENVIRONMENT}")

    if settings.REDIS_ENABLED:
        from app.core.redis_cache import redis_cache
        await redis_cache.connect()
        logger.info("Redis cache connected")


@app.on_event("shutdown")
async def shutdown():
    """Encerramento da aplicação"""
    logger.info("Shutting down CRM Jurídico API")

    if settings.REDIS_ENABLED:
        from app.core.redis_cache import redis_cache
        await redis_cache.disconnect()
        logger.info("Redis cache disconnected")
