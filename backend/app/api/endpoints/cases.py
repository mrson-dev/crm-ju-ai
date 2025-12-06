from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.features import (
    case_service,
    Case, CaseCreate, CaseUpdate, CaseStatus
)
from app.api.dependencies import get_current_user
from app.core.database import get_async_db
from app.core.pagination import PaginationParams, PaginatedResponse, pagination_params

router = APIRouter()

@router.post("/", response_model=Case, status_code=status.HTTP_201_CREATED)
async def create_case(
    case: CaseCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Cria novo processo"""
    return await case_service.create(db, case, current_user["user_id"])

@router.get("/", response_model=PaginatedResponse[Case])
async def list_cases(
    status_filter: Optional[CaseStatus] = Query(None, alias="status"),
    pagination: PaginationParams = Depends(pagination_params),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Lista processos com paginação"""
    if status_filter:
        items = await case_service.list_by_status(db, current_user["user_id"], status_filter, pagination.limit, pagination.offset)
        total = await case_service.count_by_status(db, current_user["user_id"], status_filter)
    else:
        items = await case_service.list(db, current_user["user_id"], pagination.limit, pagination.offset)
        total = await case_service.count(db, current_user["user_id"])
    return PaginatedResponse.create(items, total, pagination.page, pagination.page_size)

@router.get("/client/{client_id}", response_model=List[Case])
async def list_cases_by_client(
    client_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Lista processos de um cliente"""
    return await case_service.list_by_client(db, client_id, current_user["user_id"])

@router.get("/{case_id}", response_model=Case)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Busca processo por ID"""
    case = await case_service.get(db, case_id, current_user["user_id"])
    if not case:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    return case

@router.put("/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    case: CaseUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Atualiza processo"""
    updated_case = await case_service.update(db, case_id, case, current_user["user_id"])
    if not updated_case:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    return updated_case

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Deleta processo"""
    success = await case_service.delete(db, case_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
