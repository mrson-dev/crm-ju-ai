from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.features import document_service, Document, DocumentCreate
from app.api.dependencies import get_current_user
from app.core.database import get_async_db
from app.core.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter()

@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    case_id: str = Form(...),
    description: str = Form(None),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Faz upload de documento"""
    # Lê conteúdo do arquivo
    file_content = await file.read()
    
    # Cria objeto DocumentCreate
    document = DocumentCreate(
        name=file.filename,
        description=description,
        case_id=case_id,
        file_type=file.content_type or 'application/octet-stream',
        file_size=len(file_content),
        storage_path=""  # Será preenchido pelo service
    )
    
    return await document_service.upload(db, document, file_content, current_user["user_id"])

@router.get("/case/{case_id}", response_model=PaginatedResponse[Document])
async def list_documents_by_case(
    case_id: str,
    pagination: PaginationParams = Depends(pagination_params),
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista documentos de um processo com paginação"""
    all_documents = await document_service.list_by_case(db, case_id, current_user["user_id"])
    total = len(all_documents)
    items = all_documents[pagination.offset:pagination.offset + pagination.limit]
    return PaginatedResponse.create(items, total, pagination.page, pagination.page_size)

@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Busca documento por ID"""
    document = await document_service.get(db, document_id, current_user["user_id"])
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(get_current_user)
):
    """Deleta documento"""
    success = await document_service.delete(db, document_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
