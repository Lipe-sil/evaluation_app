from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.modules.evaluation.service import get_evaluations_received_by_employee

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


@router.get("/")
def get_employees():
    """Endpoint de exemplo para verificação rápida do módulo de colaboradores."""
    return {
        "employees": ["Alice", "Bob", "Charlie"]
    }


@router.get("/{employee_id}/evaluations")
async def get_employee_evaluations(
    employee_id: int,
    viewer_id: int | None = None,
    leader_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Retorna o histórico de avaliações recebidas pelo colaborador (`employee_id`).
    Quando `viewer_id` ou `leader_id` é informado, valida se o colaborador faz parte dos subordinados.
    """
    effective_viewer = viewer_id if viewer_id is not None else leader_id
    try:
        evaluations = await get_evaluations_received_by_employee(
            session, employee_id, viewer_id=effective_viewer
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    if evaluations is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return evaluations