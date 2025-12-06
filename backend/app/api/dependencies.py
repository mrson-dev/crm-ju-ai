"""
Dependências compartilhadas para os endpoints da API.
"""

import logging
from typing import Annotated
from fastapi import Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from firebase_admin.auth import (
    InvalidIdTokenError,
    ExpiredIdTokenError,
    RevokedIdTokenError,
    CertificateFetchError,
)

from app.core.exceptions import AuthenticationError

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Obtém usuário atual a partir do token Firebase.
    
    Args:
        credentials: Token Bearer do header Authorization
        
    Returns:
        Dict com informações do usuário autenticado
        
    Raises:
        AuthenticationError: Se token inválido/expirado
    """
    token = credentials.credentials
    
    try:
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        
        logger.debug(f"Usuário autenticado: {user_id}")
        
        return {
            "user_id": user_id,
            "email": decoded_token.get('email'),
            "firebase_uid": user_id,
            "email_verified": decoded_token.get('email_verified', False),
        }
        
    except ExpiredIdTokenError:
        logger.warning("Token expirado")
        raise AuthenticationError("Token expirado. Faça login novamente.")
        
    except RevokedIdTokenError:
        logger.warning("Token revogado")
        raise AuthenticationError("Token revogado. Faça login novamente.")
        
    except InvalidIdTokenError as e:
        logger.warning(f"Token inválido: {e}")
        raise AuthenticationError("Token inválido.")
        
    except CertificateFetchError as e:
        logger.error(f"Erro ao verificar certificado Firebase: {e}")
        raise AuthenticationError("Erro de autenticação. Tente novamente.")
        
    except Exception as e:
        logger.error(f"Erro inesperado na autenticação: {e}")
        raise AuthenticationError("Erro de autenticação.")


# Type alias para injeção de dependência
CurrentUser = Annotated[dict, Depends(get_current_user)]


class PaginationParams:
    """Parâmetros de paginação padronizados."""
    
    def __init__(
        self,
        limit: int = Query(default=50, ge=1, le=100, description="Máximo de itens por página"),
        offset: int = Query(default=0, ge=0, description="Offset para paginação"),
    ):
        self.limit = limit
        self.offset = offset


# Type alias para paginação
Pagination = Annotated[PaginationParams, Depends()]

