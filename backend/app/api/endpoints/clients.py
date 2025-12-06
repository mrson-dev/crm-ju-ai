from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.features import (
    client_service,
    Client, ClientCreate, ClientUpdate
)
from app.services.ai_service import ai_service
from app.api.dependencies import get_current_user
from app.core.database import get_async_db
from app.core.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter()

@router.post("/", response_model=Client, status_code=status.HTTP_201_CREATED)
async def create_client(
    client: ClientCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Cria novo cliente"""
    return await client_service.create(db, client, current_user["user_id"])

@router.get("/", response_model=PaginatedResponse[Client])
async def list_clients(
    pagination: PaginationParams = Depends(pagination_params),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Lista clientes com paginação"""
    items = await client_service.list(db, current_user["user_id"], pagination.limit, pagination.offset)
    total = await client_service.count(db, current_user["user_id"])
    return PaginatedResponse.create(items, total, pagination.page, pagination.page_size)

@router.get("/search", response_model=List[Client])
async def search_clients(
    q: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Busca clientes por nome ou email"""
    return await client_service.search(db, current_user["user_id"], q)

@router.get("/{client_id}", response_model=Client)
async def get_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Busca cliente por ID"""
    client = await client_service.get(db, client_id, current_user["user_id"])
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client

@router.put("/{client_id}", response_model=Client)
async def update_client(
    client_id: str,
    client: ClientUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Atualiza cliente"""
    updated_client = await client_service.update(db, client_id, client, current_user["user_id"])
    if not updated_client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return updated_client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Deleta cliente"""
    success = await client_service.delete(db, client_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

@router.post("/extract-from-document", response_model=Dict)
async def extract_client_from_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Extrai dados de cliente automaticamente usando IA a partir de imagem ou PDF
    Suporta: .png, .jpg, .jpeg, .pdf
    Máximo: 10MB
    """
    # Valida tipo de arquivo
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de arquivo não suportado. Use: {', '.join(allowed_types)}"
        )
    
    # Lê e valida tamanho do arquivo (máx 10MB)
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande ({file_size_mb:.1f}MB). Máximo: 10MB"
        )
    
    try:
        # Extrai dados usando IA
        extracted_data = await ai_service.extract_client_data_from_document(
            file_content, 
            file.content_type
        )
        
        # Calcula score de confiança
        confidence = ai_service.get_confidence_score(extracted_data)
        
        return {
            "extracted_data": extracted_data,
            "confidence_score": confidence,
            "message": "Dados extraídos com sucesso. Revise e confirme antes de salvar.",
            "filename": file.filename
        }
    
    except ValueError as e:
        # Erros de validação
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except PermissionError as e:
        # Erros de permissão
        raise HTTPException(
            status_code=403,
            detail=f"Erro de permissão: {str(e)}"
        )
    except Exception as e:
        # Erro genérico com mensagem detalhada
        error_msg = str(e)
        
        # Log do erro para debug
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erro ao processar documento: {error_msg}", exc_info=True)
        
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documento: {error_msg}"
        )
