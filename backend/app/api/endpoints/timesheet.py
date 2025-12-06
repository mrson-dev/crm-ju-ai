"""
Endpoints para Timesheet Inteligente.

Sistema de controle de tempo com:
- CRUD de entradas de tempo
- Timer com start/stop
- Sugestões de atividade por IA
- Cálculos de faturamento
- Relatórios diários e mensais
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.features import timesheet_service, TimeEntryCreate, TimeEntryUpdate
from app.core.database import get_async_db

router = APIRouter(prefix="/timesheet", tags=["Timesheet"])


# ============================================================
# CRUD DE ENTRADAS DE TEMPO
# ============================================================

@router.post("")
async def create_time_entry(
    entry_data: TimeEntryCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Cria uma nova entrada de tempo.
    
    Pode especificar duração diretamente ou usar start_time/end_time.
    O sistema calcula automaticamente o valor total baseado na taxa de faturamento.
    """
    try:
        entry = await timesheet_service.create(db, entry_data.model_dump(), user.id)
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_time_entries(
    case_id: Optional[str] = Query(None, description="Filtrar por caso"),
    client_id: Optional[str] = Query(None, description="Filtrar por cliente"),
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    is_billable: Optional[bool] = Query(None, description="Filtrar por faturável"),
    activity_type: Optional[str] = Query(None, description="Filtrar por tipo de atividade"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Lista entradas de tempo com filtros opcionais.
    
    Filtros disponíveis:
    - case_id: ID do caso
    - client_id: ID do cliente
    - start_date/end_date: Período
    - is_billable: Apenas faturáveis ou não
    - activity_type: Tipo de atividade
    """
    try:
        if case_id:
            return await timesheet_service.list_by_case(db, case_id, user.id)
        elif start_date and end_date:
            return await timesheet_service.list_by_date_range(
                db, user.id, start_date, end_date, case_id, is_billable or False
            )
        else:
            return await timesheet_service.list(db, user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{entry_id}")
async def get_time_entry(
    entry_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Obtém uma entrada de tempo específica."""
    entry = await timesheet_service.get(db, entry_id, user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada não encontrada")
    return entry


@router.put("/{entry_id}")
async def update_time_entry(
    entry_id: str,
    update_data: TimeEntryUpdate,
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Atualiza uma entrada de tempo."""
    try:
        entry = await service.update(entry_id, user.id, update_data.model_dump(exclude_unset=True))
        if not entry:
            raise HTTPException(status_code=404, detail="Entrada não encontrada")
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{entry_id}")
async def delete_time_entry(
    entry_id: str,
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Remove uma entrada de tempo."""
    try:
        success = await service.delete(entry_id, user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Entrada não encontrada")
        return {"message": "Entrada removida com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# TIMER - CRONÔMETRO
# ============================================================

@router.post("/timer/start")
async def start_timer(
    case_id: Optional[str] = Query(None, description="ID do caso"),
    client_id: Optional[str] = Query(None, description="ID do cliente"),
    description: str = Query("Timer ativo", description="Descrição inicial"),
    activity_type: str = Query("general", description="Tipo de atividade"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Inicia um timer de controle de tempo.
    
    Apenas um timer pode estar ativo por vez.
    O timer cria uma entrada de tempo com is_timer_running=True.
    """
    try:
        # Verificar se já existe timer ativo
        active_timer = await service.get_active_timer(user.id)
        if active_timer:
            raise HTTPException(
                status_code=400, 
                detail="Já existe um timer ativo. Pare-o antes de iniciar outro."
            )
        
        entry = await service.start_timer(
            user_id=user.id,
            case_id=case_id,
            client_id=client_id,
            description=description,
            activity_type=activity_type
        )
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/timer/stop/{entry_id}")
async def stop_timer(
    entry_id: str,
    description: Optional[str] = Query(None, description="Atualizar descrição"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Para o timer e calcula a duração automaticamente.
    
    Opcionalmente, pode atualizar a descrição ao parar.
    """
    try:
        entry = await service.stop_timer(entry_id, user.id, description)
        if not entry:
            raise HTTPException(status_code=404, detail="Timer não encontrado")
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timer/active")
async def get_active_timer(
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """Obtém o timer ativo, se houver."""
    try:
        timer = await service.get_active_timer(user.id)
        return timer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SUGESTÕES DE ATIVIDADE
# ============================================================

@router.get("/suggest/activity")
async def suggest_activity(
    case_id: Optional[str] = Query(None, description="ID do caso para contexto"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Sugere descrições de atividade baseadas no contexto.
    
    Usa o caso (se fornecido) e entradas recentes para sugerir
    descrições relevantes de atividade.
    """
    try:
        suggestions = await service.suggest_activity(user.id, case_id)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# FATURAMENTO E CÁLCULOS
# ============================================================

@router.get("/billing/calculate/{entry_id}")
async def calculate_billing(
    entry_id: str,
    custom_rate: Optional[float] = Query(None, ge=0, description="Taxa personalizada"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Calcula o valor de faturamento para uma entrada.
    
    Hierarquia de taxas:
    1. Taxa personalizada (se fornecida)
    2. Taxa da entrada
    3. Taxa do cliente
    4. Taxa do caso
    5. Taxa padrão (R$ 300/hora)
    """
    try:
        result = await service.calculate_billing(entry_id, user.id, custom_rate)
        if not result:
            raise HTTPException(status_code=404, detail="Entrada não encontrada")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# RELATÓRIOS
# ============================================================

@router.get("/report/daily")
async def get_daily_summary(
    target_date: Optional[date] = Query(None, description="Data (padrão: hoje)"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Obtém resumo diário de horas trabalhadas.
    
    Retorna:
    - Total de horas
    - Horas faturáveis
    - Valor total
    - Breakdown por caso/cliente
    - Breakdown por tipo de atividade
    """
    try:
        report_date = target_date or date.today()
        report = await service.get_daily_summary(user.id, report_date)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/monthly")
async def get_monthly_report(
    year: int = Query(..., ge=2020, le=2100, description="Ano"),
    month: int = Query(..., ge=1, le=12, description="Mês"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Obtém relatório mensal completo.
    
    Retorna:
    - Resumo geral (horas, valor, média diária)
    - Por semana
    - Por caso
    - Por cliente
    - Por tipo de atividade
    - Detalhes diários
    """
    try:
        report = await service.get_monthly_report(user.id, year, month)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/case/{case_id}")
async def get_case_time_report(
    case_id: str,
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Obtém relatório de tempo por caso.
    
    Útil para faturamento e análise de produtividade por caso.
    """
    try:
        entries = await service.list_entries(
            user_id=user.id,
            filters={"case_id": case_id},
            start_date=start_date,
            end_date=end_date
        )
        
        total_minutes = sum(e.get("duration_minutes", 0) for e in entries)
        billable_minutes = sum(
            e.get("duration_minutes", 0) for e in entries 
            if e.get("is_billable", True)
        )
        total_amount = sum(e.get("total_amount", 0) for e in entries)
        
        # Agrupar por tipo de atividade
        by_activity = {}
        for entry in entries:
            activity = entry.get("activity_type", "general")
            if activity not in by_activity:
                by_activity[activity] = {"minutes": 0, "amount": 0, "count": 0}
            by_activity[activity]["minutes"] += entry.get("duration_minutes", 0)
            by_activity[activity]["amount"] += entry.get("total_amount", 0)
            by_activity[activity]["count"] += 1
        
        return {
            "case_id": case_id,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_entries": len(entries),
                "total_hours": round(total_minutes / 60, 2),
                "billable_hours": round(billable_minutes / 60, 2),
                "non_billable_hours": round((total_minutes - billable_minutes) / 60, 2),
                "total_amount": round(total_amount, 2)
            },
            "by_activity_type": by_activity,
            "entries": entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/client/{client_id}")
async def get_client_time_report(
    client_id: str,
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    user=Depends(get_current_user),
    service: TimesheetService = Depends(get_timesheet_service)
):
    """
    Obtém relatório de tempo por cliente.
    
    Agrupa todas as entradas do cliente, incluindo de múltiplos casos.
    """
    try:
        entries = await service.list_entries(
            user_id=user.id,
            filters={"client_id": client_id},
            start_date=start_date,
            end_date=end_date
        )
        
        total_minutes = sum(e.get("duration_minutes", 0) for e in entries)
        billable_minutes = sum(
            e.get("duration_minutes", 0) for e in entries 
            if e.get("is_billable", True)
        )
        total_amount = sum(e.get("total_amount", 0) for e in entries)
        
        # Agrupar por caso
        by_case = {}
        for entry in entries:
            case_id = entry.get("case_id") or "sem_caso"
            case_title = entry.get("case_title") or "Sem caso vinculado"
            if case_id not in by_case:
                by_case[case_id] = {
                    "title": case_title,
                    "minutes": 0, 
                    "amount": 0, 
                    "count": 0
                }
            by_case[case_id]["minutes"] += entry.get("duration_minutes", 0)
            by_case[case_id]["amount"] += entry.get("total_amount", 0)
            by_case[case_id]["count"] += 1
        
        return {
            "client_id": client_id,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_entries": len(entries),
                "total_hours": round(total_minutes / 60, 2),
                "billable_hours": round(billable_minutes / 60, 2),
                "non_billable_hours": round((total_minutes - billable_minutes) / 60, 2),
                "total_amount": round(total_amount, 2)
            },
            "by_case": by_case,
            "entries": entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
