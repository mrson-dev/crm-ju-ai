from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.features import (
    template_service,
    Template, TemplateCreate, TemplateUpdate,
    GeneratedDocument, GeneratedDocumentCreate
)
from app.api.dependencies import get_current_user
from app.core.database import get_async_db
from app.core.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter()

# Templates CRUD

@router.post("/", response_model=Template, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Cria novo template de documento"""
    return await template_service.create(db, template, current_user["user_id"])

@router.get("/", response_model=PaginatedResponse[Template])
async def list_templates(
    category: Optional[str] = None,
    include_public: bool = True,
    pagination: PaginationParams = Depends(pagination_params),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Lista templates do usuário e públicos com paginação"""
    all_items = await template_service.list_with_public(
        db,
        current_user["user_id"],
        category,
        include_public
    )
    items = all_items[pagination.offset:pagination.offset + pagination.limit]
    total = len(all_items)
    return PaginatedResponse.create(items, total, pagination.page, pagination.page_size)

@router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Busca template por ID"""
    template = await template_service.get(db, template_id, current_user["user_id"])
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    return template

@router.put("/{template_id}", response_model=Template)
async def update_template(
    template_id: str,
    template: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Atualiza template"""
    updated_template = await template_service.update(
        db,
        template_id, 
        template, 
        current_user["user_id"]
    )
    if not updated_template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    return updated_template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Deleta template"""
    success = await template_service.delete(db, template_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Template não encontrado")

# Document Generation

@router.post("/{template_id}/generate", response_model=GeneratedDocument)
async def generate_document(
    template_id: str,
    placeholders_data: Dict = Body(...),
    client_id: Optional[str] = Body(None),
    case_id: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Gera documento a partir de template preenchendo placeholders
    
    Body exemplo:
    {
        "placeholders_data": {
            "cliente": {"nome": "João Silva", "cpf_cnpj": "123.456.789-00"},
            "advogado": {"nome": "Dr. Maria", "oab": "OAB/SP 123456"},
            "documento": {"data": "04/12/2024"}
        },
        "client_id": "client123",
        "case_id": "case456"
    }
    """
    try:
        return await template_service.generate_document(
            template_id,
            placeholders_data,
            current_user["user_id"],
            client_id,
            case_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar documento: {str(e)}")

# Generated Documents

@router.get("/documents/generated", response_model=List[GeneratedDocument])
async def list_generated_documents(
    client_id: Optional[str] = None,
    case_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lista documentos gerados"""
    return await template_service.list_generated_documents(
        current_user["user_id"],
        client_id,
        case_id
    )

@router.get("/documents/generated/{doc_id}", response_model=GeneratedDocument)
async def get_generated_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Busca documento gerado por ID"""
    document = await template_service.get_generated_document(
        doc_id, 
        current_user["user_id"]
    )
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return document

@router.delete("/documents/generated/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_generated_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deleta documento gerado"""
    success = await template_service.delete_generated_document(
        doc_id, 
        current_user["user_id"]
    )
    if not success:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
