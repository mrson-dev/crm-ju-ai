"""
Middleware para compressão GZip de respostas.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware as StarletteGZipMiddleware
from fastapi import Request
from typing import Callable
import logging

logger = logging.getLogger(__name__)


class CompressionMiddleware(StarletteGZipMiddleware):
    """
    Middleware para compressão GZip de respostas HTTP.
    
    Comprime automaticamente respostas maiores que minimum_size
    quando o cliente suporta gzip (header Accept-Encoding: gzip).
    
    Benefícios:
    - Reduz tamanho de payloads JSON grandes (listas paginadas)
    - Economiza bandwidth
    - Melhora tempo de resposta para clientes com internet lenta
    
    Usage:
        app.add_middleware(CompressionMiddleware, minimum_size=1000)
    """
    
    def __init__(
        self,
        app,
        minimum_size: int = 1000,  # Comprimir apenas respostas > 1KB
        compresslevel: int = 5     # Nível 5 = bom balanço entre compressão e CPU
    ):
        """
        Inicializa middleware de compressão.
        
        Args:
            app: Aplicação ASGI
            minimum_size: Tamanho mínimo em bytes para comprimir (padrão: 1000)
            compresslevel: Nível de compressão de 1 (rápido) a 9 (máximo) (padrão: 5)
        """
        super().__init__(app, minimum_size=minimum_size, compresslevel=compresslevel)
        logger.info(
            f"Compression middleware initialized: "
            f"minimum_size={minimum_size}, compresslevel={compresslevel}"
        )


# Configurações recomendadas por ambiente
COMPRESSION_CONFIGS = {
    "development": {
        "minimum_size": 500,    # Comprimir a partir de 500 bytes
        "compresslevel": 3      # Compressão leve para dev
    },
    "production": {
        "minimum_size": 1000,   # Comprimir a partir de 1KB
        "compresslevel": 6      # Compressão mais agressiva
    }
}
