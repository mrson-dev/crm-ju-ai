"""
Testes para CaseService.
"""
import pytest
from datetime import date
from app.features import case_service, CaseCreate, CaseStatus, CasePriority


@pytest.mark.asyncio
async def test_create_case(db_session, mock_user):
    """Testa criação de processo."""
    case_data = CaseCreate(
        client_id="client_123",
        title="Ação de Indenização",
        description="Processo trabalhista",
        case_number="0001234-56.2025.8.26.0100",
        court="TRT 2ª Região",
        status=CaseStatus.active,
        priority=CasePriority.high,
        start_date=date(2025, 1, 15)
    )
    
    case = await case_service.create(db_session, case_data, mock_user["user_id"])
    
    assert case.id is not None
    assert case.title == "Ação de Indenização"
    assert case.status == CaseStatus.active
    assert case.priority == CasePriority.high


@pytest.mark.asyncio
async def test_list_cases_by_status(db_session, mock_user):
    """Testa listagem de processos por status."""
    # Criar processos com diferentes status
    for status in [CaseStatus.active, CaseStatus.active, CaseStatus.closed]:
        case_data = CaseCreate(
            client_id="client_123",
            title=f"Processo {status.value}",
            description="Teste",
            case_number=f"000{status.value}-56.2025.8.26.0100",
            court="TRT",
            status=status,
            priority=CasePriority.medium,
            start_date=date.today()
        )
        await case_service.create(db_session, case_data, mock_user["user_id"])
    
    # Listar apenas ativos
    active_cases = await case_service.list_by_status(
        db_session, 
        mock_user["user_id"], 
        CaseStatus.active, 
        limit=10
    )
    
    assert len(active_cases) == 2
    assert all(c.status == CaseStatus.active for c in active_cases)
