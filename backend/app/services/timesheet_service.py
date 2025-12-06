"""
Service para gerenciamento de Timesheet (controle de horas) com Cloud SQL.

Sistema inteligente de controle de tempo com cálculo automático de faturamento.
"""

import logging
from typing import List, Optional, Dict
from datetime import datetime, date

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import TimeEntry as DBTimeEntry
from app.services.base_sql_service import BaseSQLService

logger = logging.getLogger(__name__)


class TimesheetService(BaseSQLService[DBTimeEntry, dict, dict]):
    """
    Service para operações com timesheet/controle de horas.
    
    Features:
    - CRUD de lançamentos de horas (herda de BaseSQLService)
    - Relatórios por período/caso
    - Cálculo de valores baseado em taxa horária
    """
    
    model = DBTimeEntry
    
    DEFAULT_HOURLY_RATE = 300.0  # R$/hora
    
    async def list_by_case(
        self,
        db: AsyncSession,
        case_id: str,
        user_id: str,
        limit: int = 100
    ) -> List[DBTimeEntry]:
        """Lista entradas de tempo de um caso específico."""
        return await self.list(
            db=db,
            user_id=user_id,
            limit=limit,
            filters={"case_id": case_id},
            order_by="date",
            descending=True
        )
    
    async def list_by_date_range(
        self,
        db: AsyncSession,
        user_id: str,
        start_date: date,
        end_date: date,
        case_id: Optional[str] = None,
        billable_only: bool = False,
        limit: int = 200
    ) -> List[DBTimeEntry]:
        """
        Lista entradas de tempo por período.
        
        Args:
            db: Sessão do banco
            user_id: ID do usuário
            start_date: Data inicial
            end_date: Data final
            case_id: Filtrar por caso (opcional)
            billable_only: Apenas faturáveis
            limit: Máximo de entradas
            
        Returns:
            Lista de entradas
        """
        try:
            # Converte dates para datetime
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            
            # Monta query
            conditions = [
                DBTimeEntry.user_id == user_id,
                DBTimeEntry.date >= start_datetime,
                DBTimeEntry.date <= end_datetime
            ]
            
            if case_id:
                conditions.append(DBTimeEntry.case_id == case_id)
            
            if billable_only:
                conditions.append(DBTimeEntry.billable.is_(True))
            
            result = await db.execute(
                select(DBTimeEntry)
                .where(and_(*conditions))
                .order_by(DBTimeEntry.date.desc())
                .limit(limit)
            )
            
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error listing time entries: {e}")
            return []
    
    async def get_summary(
        self,
        db: AsyncSession,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        case_id: Optional[str] = None
    ) -> Dict:
        """
        Sumário de horas trabalhadas e valores.
        
        Args:
            db: Sessão do banco
            user_id: ID do usuário
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)
            case_id: Filtrar por caso (opcional)
            
        Returns:
            Dict com total_hours, billable_hours, total_amount
        """
        try:
            # Monta condições
            conditions = [DBTimeEntry.user_id == user_id]
            
            if start_date:
                start_datetime = datetime.combine(start_date, datetime.min.time())
                conditions.append(DBTimeEntry.date >= start_datetime)
            
            if end_date:
                end_datetime = datetime.combine(end_date, datetime.max.time())
                conditions.append(DBTimeEntry.date <= end_datetime)
            
            if case_id:
                conditions.append(DBTimeEntry.case_id == case_id)
            
            # Query para totais
            result = await db.execute(
                select(
                    func.sum(DBTimeEntry.duration).label('total_minutes'),
                    func.sum(
                        func.case(
                            (DBTimeEntry.billable.is_(True), DBTimeEntry.duration),
                            else_=0
                        )
                    ).label('billable_minutes')
                )
                .where(and_(*conditions))
            )
            
            row = result.one()
            
            total_minutes = row.total_minutes or 0
            billable_minutes = row.billable_minutes or 0
            
            # Calcula valores (assumindo taxa padrão se não especificada)
            total_hours = total_minutes / 60.0
            billable_hours = billable_minutes / 60.0
            total_amount = billable_hours * self.DEFAULT_HOURLY_RATE
            
            return {
                "total_hours": round(total_hours, 2),
                "billable_hours": round(billable_hours, 2),
                "non_billable_hours": round(total_hours - billable_hours, 2),
                "total_amount": round(total_amount, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting timesheet summary: {e}")
            return {
                "total_hours": 0.0,
                "billable_hours": 0.0,
                "non_billable_hours": 0.0,
                "total_amount": 0.0
            }


# Instância singleton
timesheet_service = TimesheetService()
