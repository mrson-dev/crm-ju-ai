"""
Endpoints para Automação de Documentos.

Sistema avançado de geração de documentos jurídicos com:
- Geração a partir de templates
- Assembly de múltiplos templates
- Auto-preenchimento de dados
- Versionamento
- Sugestões de conteúdo com IA
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.services.document_automation_service import document_automation_service
from app.core.database import get_async_db

router = APIRouter(prefix="/document-automation", tags=["Document Automation"])


# ============================================================
# SCHEMAS
# ============================================================

class GenerateFromTemplateRequest(BaseModel):
    """Request para gerar documento de template."""
    template_id: str = Field(..., description="ID do template")
    placeholders: Dict[str, str] = Field(default_factory=dict, description="Dados dos placeholders")
    client_id: Optional[str] = Field(None, description="ID do cliente para auto-preenchimento")
    case_id: Optional[str] = Field(None, description="ID do caso para auto-preenchimento")
    title: Optional[str] = Field(None, description="Título do documento")


class AssemblyRequest(BaseModel):
    """Request para combinar múltiplos templates."""
    template_ids: List[str] = Field(..., min_length=1, description="IDs dos templates")
    placeholders: Dict[str, str] = Field(default_factory=dict, description="Dados dos placeholders")
    client_id: Optional[str] = Field(None, description="ID do cliente")
    case_id: Optional[str] = Field(None, description="ID do caso")
    title: str = Field("Documento Combinado", description="Título do documento")
    separator: str = Field("\n\n---\n\n", description="Separador entre templates")


class DocumentCreateRequest(BaseModel):
    """Request para criar documento manualmente."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(default="")
    category: str = Field(default="outro")
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class DocumentUpdateRequest(BaseModel):
    """Request para atualizar documento."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    version_notes: Optional[str] = Field(None, description="Notas da versão")


class SuggestContentRequest(BaseModel):
    """Request para sugestões de conteúdo."""
    document_type: str = Field(..., description="Tipo de documento")
    context: Dict[str, Any] = Field(default_factory=dict, description="Contexto adicional")


# ============================================================
# DOCUMENTOS GERADOS - CRUD
# ============================================================

@router.post("/documents")
async def create_document(
    data: DocumentCreateRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Cria um novo documento manualmente."""
    try:
        document = await document_automation_service.create(db, data.model_dump(), user.id)
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def list_documents(
    category: Optional[str] = Query(None, description="Filtrar por categoria"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    client_id: Optional[str] = Query(None, description="Filtrar por cliente"),
    case_id: Optional[str] = Query(None, description="Filtrar por caso"),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
    service: DocumentAutomationService = Depends(get_service)
):
    """Lista documentos gerados com filtros."""
    try:
        filters = {}
        if category:
            filters["category"] = category
        if status:
            filters["status"] = status
        if client_id:
            filters["client_id"] = client_id
        if case_id:
            filters["case_id"] = case_id
        
        documents = await service.list_documents(user.id, filters, limit)
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}")
async def get_document(
    doc_id: str,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Obtém documento por ID."""
    document = await service.get(doc_id, user.id)
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return document


@router.put("/documents/{doc_id}")
async def update_document(
    doc_id: str,
    data: DocumentUpdateRequest,
    create_version: bool = Query(True, description="Criar nova versão se conteúdo mudar"),
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Atualiza documento."""
    try:
        document = await service.update_document(
            doc_id, user.id, data.model_dump(exclude_unset=True), create_version
        )
        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Remove documento."""
    try:
        success = await service.delete_document(doc_id, user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        return {"message": "Documento removido com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GERAÇÃO DE DOCUMENTOS
# ============================================================

@router.post("/generate")
async def generate_from_template(
    data: GenerateFromTemplateRequest,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """
    Gera documento a partir de um template.
    
    Preenche automaticamente os placeholders com dados do cliente e caso,
    além dos valores fornecidos manualmente.
    """
    try:
        document = await service.generate_from_template(
            user_id=user.id,
            template_id=data.template_id,
            placeholders_data=data.placeholders,
            client_id=data.client_id,
            case_id=data.case_id,
            title=data.title
        )
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assembly")
async def assembly_documents(
    data: AssemblyRequest,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """
    Combina múltiplos templates em um único documento (Assembly).
    
    Útil para criar documentos complexos combinando petições,
    procurações, declarações, etc.
    """
    try:
        document = await service.assembly_documents(
            user_id=user.id,
            template_ids=data.template_ids,
            placeholders_data=data.placeholders,
            client_id=data.client_id,
            case_id=data.case_id,
            title=data.title,
            separator=data.separator
        )
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# AUTO-PREENCHIMENTO E SUGESTÕES
# ============================================================

@router.get("/auto-fill")
async def get_auto_fill_data(
    client_id: Optional[str] = Query(None, description="ID do cliente"),
    case_id: Optional[str] = Query(None, description="ID do caso"),
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """
    Retorna dados disponíveis para auto-preenchimento.
    
    Útil para preview antes de gerar o documento.
    """
    try:
        data = await service.get_auto_fill_data(user.id, client_id, case_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest")
async def suggest_content(
    data: SuggestContentRequest,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """
    Sugere conteúdo baseado no tipo de documento e contexto.
    
    Retorna sugestões para diferentes seções do documento.
    """
    try:
        suggestions = await service.suggest_content(
            user.id, data.document_type, data.context
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/placeholders")
async def get_placeholders(
    service: DocumentAutomationService = Depends(get_service)
):
    """Retorna todos os placeholders disponíveis do sistema."""
    return service.get_available_placeholders()


# ============================================================
# VERSIONAMENTO
# ============================================================

@router.get("/documents/{doc_id}/versions")
async def get_document_versions(
    doc_id: str,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Lista todas as versões de um documento."""
    document = await service.get(doc_id, user.id)
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    return {
        "document_id": doc_id,
        "current_version": document.get("version", 1),
        "versions": document.get("versions", [])
    }


@router.post("/documents/{doc_id}/restore/{version}")
async def restore_version(
    doc_id: str,
    version: int,
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Restaura uma versão anterior do documento."""
    try:
        document = await service.restore_version(doc_id, user.id, version)
        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")
        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ESTATÍSTICAS
# ============================================================

@router.get("/stats")
async def get_document_stats(
    user=Depends(get_current_user),
    service: DocumentAutomationService = Depends(get_service)
):
    """Retorna estatísticas de documentos do usuário."""
    try:
        stats = await service.get_document_stats(user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# CATEGORIAS
# ============================================================

@router.get("/categories")
async def get_categories(
    service: DocumentAutomationService = Depends(get_service)
):
    """Retorna categorias de documentos disponíveis."""
    return service.DOCUMENT_CATEGORIES
