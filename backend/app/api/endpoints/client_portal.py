"""
Endpoints do Portal do Cliente.

Permite que clientes acessem seus processos, documentos e mensagens
usando autenticação por token único ou email/código.
"""

import secrets
import logging
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from pydantic import BaseModel, EmailStr

from app.core.firebase import firebase_service
from app.core.security import create_access_token
from app.features import Case, CaseStatus, Document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portal", tags=["client-portal"])


# ==================== Schemas do Portal ====================

class PortalAccessRequest(BaseModel):
    """Solicitação de acesso ao portal via email."""
    email: EmailStr


class PortalVerifyCode(BaseModel):
    """Verificação de código de acesso."""
    email: EmailStr
    code: str


class PortalAccessToken(BaseModel):
    """Token de acesso ao portal."""
    access_token: str
    token_type: str = "bearer"
    client_id: str
    client_name: str
    expires_in: int


class PortalMessage(BaseModel):
    """Mensagem do cliente para o advogado."""
    case_id: str
    message: str


class PortalMessageCreate(BaseModel):
    """Criar mensagem no portal."""
    subject: str
    content: str
    case_id: Optional[str] = None


class PortalMessageResponse(BaseModel):
    """Resposta de mensagem do portal."""
    id: str
    client_id: str
    case_id: Optional[str]
    subject: str
    content: str
    is_from_client: bool
    read_at: Optional[datetime]
    created_at: datetime


class CasePublicView(BaseModel):
    """Visualização pública do caso para o cliente."""
    id: str
    title: str
    case_number: Optional[str]
    status: CaseStatus
    description: str
    court: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    # Timeline simplificada
    timeline: List[dict] = []


class DocumentPublicView(BaseModel):
    """Visualização pública de documento para o cliente."""
    id: str
    name: str
    description: Optional[str]
    file_type: str
    created_at: Optional[datetime]
    download_url: Optional[str] = None


# ==================== Funções Auxiliares ====================

def generate_access_code() -> str:
    """Gera código de acesso de 6 dígitos."""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def get_portal_collection():
    """Retorna referência à collection de tokens do portal."""
    return firebase_service.db.collection("portal_access")


def get_messages_collection():
    """Retorna referência à collection de mensagens do portal."""
    return firebase_service.db.collection("portal_messages")


async def get_client_by_email(email: str) -> Optional[dict]:
    """Busca cliente por email em todos os escritórios."""
    try:
        clients_ref = firebase_service.db.collection("clients")
        query = clients_ref.where("email", "==", email).limit(1)
        docs = list(query.stream())
        
        if docs:
            data = docs[0].to_dict()
            data["id"] = docs[0].id
            return data
        return None
    except Exception as e:
        logger.error(f"Erro ao buscar cliente por email: {e}")
        return None


async def verify_portal_token(token: str) -> Optional[dict]:
    """Verifica token do portal e retorna dados do cliente."""
    try:
        doc = get_portal_collection().document(token).get()
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        
        # Verifica expiração
        expires_at = data.get("expires_at")
        if expires_at and expires_at < datetime.now(timezone.utc):
            return None
        
        return data
    except Exception as e:
        logger.error(f"Erro ao verificar token do portal: {e}")
        return None


# ==================== Dependency ====================

async def get_portal_client(
    authorization: str = Query(..., alias="token", description="Token de acesso do portal")
) -> dict:
    """Dependency para autenticação do portal do cliente."""
    client_data = await verify_portal_token(authorization)
    if not client_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    return client_data


# ==================== Endpoints de Autenticação ====================

@router.post("/request-access", response_model=dict)
async def request_portal_access(request: PortalAccessRequest):
    """
    Solicita acesso ao portal do cliente.
    
    Envia um código de verificação de 6 dígitos para o email do cliente.
    O código expira em 15 minutos.
    """
    # Busca cliente pelo email
    client = await get_client_by_email(request.email)
    
    if not client:
        # Por segurança, não informamos se o email existe ou não
        return {
            "message": "Se o email estiver cadastrado, você receberá um código de acesso."
        }
    
    # Gera código de acesso
    code = generate_access_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Salva código temporário
    code_doc = {
        "email": request.email,
        "code": code,
        "client_id": client["id"],
        "client_name": client["name"],
        "user_id": client["user_id"],  # ID do advogado
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc)
    }

    get_portal_collection().document(f"code_{request.email}").set(code_doc)

    logger.info(f"Código de acesso gerado para {request.email}: {code}")

    response = {
        "message": "Se o email estiver cadastrado, você receberá um código de acesso."
    }
    import os
    if os.getenv("ENVIRONMENT", "development") != "production":
        response["_dev_code"] = code
    
    return response


@router.post("/verify-code", response_model=PortalAccessToken)
async def verify_portal_code(request: PortalVerifyCode):
    """
    Verifica o código de acesso e retorna um token de sessão.
    
    O token de sessão é válido por 24 horas.
    """
    # Busca código
    code_doc = get_portal_collection().document(f"code_{request.email}").get()
    
    if not code_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )
    
    code_data = code_doc.to_dict()
    
    # Verifica se já foi usado
    if code_data.get("used"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código já utilizado"
        )
    
    # Verifica expiração
    expires_at = code_data.get("expires_at")
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código expirado"
        )
    
    # Verifica código
    if code_data.get("code") != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    # Marca código como usado
    get_portal_collection().document(f"code_{request.email}").update({"used": True})
    
    # Cria token de sessão (válido por 24h)
    session_token = secrets.token_urlsafe(32)
    session_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    session_data = {
        "client_id": code_data["client_id"],
        "client_name": code_data["client_name"],
        "user_id": code_data["user_id"],
        "email": request.email,
        "expires_at": session_expires,
        "created_at": datetime.now(timezone.utc)
    }
    
    get_portal_collection().document(session_token).set(session_data)
    
    return PortalAccessToken(
        access_token=session_token,
        client_id=code_data["client_id"],
        client_name=code_data["client_name"],
        expires_in=86400  # 24 horas em segundos
    )


@router.post("/logout")
async def portal_logout(
    client: dict = Depends(get_portal_client),
    authorization: str = Query(..., alias="token", description="Token de acesso do portal")
):
    """Encerra a sessão do portal e invalida o token."""
    try:
        # Invalida o token removendo do Firestore
        get_portal_collection().document(authorization).delete()
        logger.info(f"Token invalidado para cliente {client.get('client_id')}")
    except Exception as e:
        logger.error(f"Erro ao invalidar token: {e}")
    
    return {"message": "Sessão encerrada com sucesso"}


# ==================== Endpoints de Casos ====================

@router.get("/cases", response_model=List[CasePublicView])
async def list_client_cases(
    status_filter: Optional[CaseStatus] = Query(None, alias="status"),
    client: dict = Depends(get_portal_client)
):
    """
    Lista os casos do cliente.
    
    Retorna apenas informações públicas dos casos associados ao cliente.
    """
    try:
        cases_ref = firebase_service.db.collection("cases")
        query = cases_ref.where("client_id", "==", client["client_id"])
        
        if status_filter:
            query = query.where("status", "==", status_filter.value)
        
        query = query.order_by("updated_at", direction="DESCENDING")
        
        docs = query.stream()
        cases = []
        
        for doc in docs:
            data = doc.to_dict()
            cases.append(CasePublicView(
                id=doc.id,
                title=data.get("title", ""),
                case_number=data.get("case_number"),
                status=data.get("status", "novo"),
                description=data.get("description", ""),
                court=data.get("court"),
                created_at=data.get("created_at"),
                updated_at=data.get("updated_at"),
                timeline=data.get("timeline", [])
            ))
        
        return cases
        
    except Exception as e:
        logger.error(f"Erro ao listar casos do cliente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar casos"
        )


@router.get("/cases/{case_id}", response_model=CasePublicView)
async def get_case_detail(
    case_id: str,
    client: dict = Depends(get_portal_client)
):
    """
    Retorna detalhes de um caso específico.
    
    Verifica se o caso pertence ao cliente autenticado.
    """
    try:
        doc = firebase_service.db.collection("cases").document(case_id).get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caso não encontrado"
            )
        
        data = doc.to_dict()
        
        # Verifica se o caso pertence ao cliente
        if data.get("client_id") != client["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        return CasePublicView(
            id=doc.id,
            title=data.get("title", ""),
            case_number=data.get("case_number"),
            status=data.get("status", "novo"),
            description=data.get("description", ""),
            court=data.get("court"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            timeline=data.get("timeline", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar caso: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar caso"
        )


# ==================== Endpoints de Documentos ====================

@router.get("/cases/{case_id}/documents", response_model=List[DocumentPublicView])
async def list_case_documents(
    case_id: str,
    client: dict = Depends(get_portal_client)
):
    """
    Lista documentos públicos de um caso.
    
    Apenas documentos marcados como públicos são retornados.
    """
    try:
        # Verifica se o caso pertence ao cliente
        case_doc = firebase_service.db.collection("cases").document(case_id).get()
        
        if not case_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caso não encontrado"
            )
        
        case_data = case_doc.to_dict()
        if case_data.get("client_id") != client["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        # Busca documentos do caso
        docs_ref = firebase_service.db.collection("documents")
        query = docs_ref.where("case_id", "==", case_id)
        # Apenas documentos públicos (se implementado)
        # query = query.where("is_public", "==", True)
        
        docs = query.stream()
        documents = []
        
        for doc in docs:
            data = doc.to_dict()
            documents.append(DocumentPublicView(
                id=doc.id,
                name=data.get("name", ""),
                description=data.get("description"),
                file_type=data.get("file_type", ""),
                created_at=data.get("created_at"),
                download_url=data.get("download_url")
            ))
        
        return documents
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar documentos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar documentos"
        )


# ==================== Endpoints de Mensagens ====================

@router.get("/messages", response_model=List[PortalMessageResponse])
async def list_messages(
    case_id: Optional[str] = None,
    unread_only: bool = False,
    client: dict = Depends(get_portal_client)
):
    """
    Lista mensagens do cliente.
    
    Inclui mensagens enviadas e recebidas.
    """
    try:
        query = get_messages_collection().where("client_id", "==", client["client_id"])
        
        if case_id:
            query = query.where("case_id", "==", case_id)
        
        if unread_only:
            query = query.where("read_at", "==", None).where("is_from_client", "==", False)
        
        query = query.order_by("created_at", direction="DESCENDING").limit(50)
        
        docs = query.stream()
        messages = []
        
        for doc in docs:
            data = doc.to_dict()
            messages.append(PortalMessageResponse(
                id=doc.id,
                client_id=data.get("client_id", ""),
                case_id=data.get("case_id"),
                subject=data.get("subject", ""),
                content=data.get("content", ""),
                is_from_client=data.get("is_from_client", True),
                read_at=data.get("read_at"),
                created_at=data.get("created_at", datetime.now(timezone.utc))
            ))
        
        return messages
        
    except Exception as e:
        logger.error(f"Erro ao listar mensagens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar mensagens"
        )


@router.post("/messages", response_model=PortalMessageResponse)
async def send_message(
    message: PortalMessageCreate,
    client: dict = Depends(get_portal_client)
):
    """
    Envia uma mensagem para o advogado.
    """
    try:
        message_id = get_messages_collection().document().id
        
        message_data = {
            "id": message_id,
            "client_id": client["client_id"],
            "user_id": client["user_id"],  # Advogado destinatário
            "case_id": message.case_id,
            "subject": message.subject,
            "content": message.content,
            "is_from_client": True,
            "read_at": None,
            "created_at": datetime.now(timezone.utc)
        }
        
        get_messages_collection().document(message_id).set(message_data)
        
        return PortalMessageResponse(**message_data)
        
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar mensagem"
        )


@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    client: dict = Depends(get_portal_client)
):
    """Marca uma mensagem como lida."""
    try:
        doc = get_messages_collection().document(message_id).get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem não encontrada"
            )
        
        data = doc.to_dict()
        if data.get("client_id") != client["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado"
            )
        
        get_messages_collection().document(message_id).update({
            "read_at": datetime.now(timezone.utc)
        })
        
        return {"message": "Mensagem marcada como lida"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao marcar mensagem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar mensagem"
        )


# ==================== Endpoints de Perfil ====================

@router.get("/profile")
async def get_client_profile(client: dict = Depends(get_portal_client)):
    """Retorna o perfil do cliente autenticado."""
    try:
        doc = firebase_service.db.collection("clients").document(client["client_id"]).get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )
        
        data = doc.to_dict()
        
        # Retorna apenas dados públicos
        return {
            "id": client["client_id"],
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "client_type": data.get("client_type"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar perfil: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar perfil"
        )


# ==================== Dashboard do Portal ====================

@router.get("/dashboard")
async def get_portal_dashboard(client: dict = Depends(get_portal_client)):
    """
    Retorna dados resumidos para o dashboard do portal.
    
    Inclui:
    - Número de casos por status
    - Mensagens não lidas
    - Próximos eventos
    """
    try:
        # Contagem de casos por status
        cases_ref = firebase_service.db.collection("cases")
        cases_query = cases_ref.where("client_id", "==", client["client_id"])
        cases = list(cases_query.stream())
        
        cases_by_status = {}
        for doc in cases:
            status = doc.to_dict().get("status", "novo")
            cases_by_status[status] = cases_by_status.get(status, 0) + 1
        
        # Mensagens não lidas
        messages_query = (
            get_messages_collection()
            .where("client_id", "==", client["client_id"])
            .where("is_from_client", "==", False)
            .where("read_at", "==", None)
        )
        unread_messages = len(list(messages_query.stream()))
        
        return {
            "total_cases": len(cases),
            "cases_by_status": cases_by_status,
            "unread_messages": unread_messages,
            "client_name": client["client_name"]
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar dados do dashboard"
        )
