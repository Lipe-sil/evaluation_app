from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.dto.evaluation_dto import (
    EvaluationDTO,
    EvaluationHistoryDTO,
)
from app.modules.employee.service import get_allowed_employee_ids
from app.modules.evaluation.service import (
    create_evaluation,
    get_all_evaluation,
    get_all_evaluations_for_leader,
    get_evaluations_received_by_employee,
    get_next_evaluation_date,
    get_pending_evaluations,
)

router = APIRouter(
    prefix="/evaluation",
    tags=["evaluation"],
)


@router.post("/submit")
async def submit_evaluation(
    evaluation_data: EvaluationDTO,
    session: AsyncSession = Depends(get_session),
):
    """
    Submete uma nova avaliação de desempenho para um liderado da hierarquia do líder.
    Valida permissão hierárquica, notas de 1 a 4 e limite de 1 avaliação por semana por par (líder, liderado).
    """
    allowed_employee_ids = await get_allowed_employee_ids(
        session, evaluation_data.leader_id
    )
    try:
        evaluation_id = await create_evaluation(
            session, allowed_employee_ids, evaluation_data
        )
        return evaluation_id
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )


@router.post("/history")
async def get_evaluation_history(
    evaluation_history_data: EvaluationHistoryDTO,
    session: AsyncSession = Depends(get_session),
):
    """
    Consulta o histórico de avaliações concluídas dos subordinados do líder,
    com suporte a ordenação ('DATE' ou 'LAST') e filtro por intervalo de datas.
    """
    allowed_employee_ids = await get_allowed_employee_ids(
        session, evaluation_history_data.leader_id
    )
    try:
        return await get_all_evaluation(
            allowed_employee_ids=allowed_employee_ids,
            order_by=evaluation_history_data.order,
            date_from=evaluation_history_data.date_from,
            date_to=evaluation_history_data.date_to,
            session=session,
            leader_id=evaluation_history_data.leader_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.get("/history")
async def get_history_by_leader(
    leader_id: int = 1,
    session: AsyncSession = Depends(get_session),
):
    """Atalho GET para listar o histórico de avaliações visíveis para a hierarquia de `leader_id`."""
    allowed_employee_ids = await get_allowed_employee_ids(session, leader_id)
    return await get_all_evaluation(
        allowed_employee_ids=allowed_employee_ids,
        order_by="DATE",
        date_from=None,
        date_to=None,
        session=session,
        leader_id=leader_id,
    )


@router.get("/pending")
async def get_pending_evaluations_endpoint(
    leader_id: int = 1,
    session: AsyncSession = Depends(get_session),
):
    """Retorna a árvore hierárquica de subordinados com o status semanal de avaliação ('pending' ou 'completed')."""
    return await get_pending_evaluations(leader_id, session)


@router.get("/all")
async def get_all_evaluations_endpoint(
    leader_id: int = 1,
    session: AsyncSession = Depends(get_session),
):
    """Retorna a lista consolidada de avaliações pendentes da semana e histórico dos subordinados."""
    allowed_employee_ids = await get_allowed_employee_ids(session, leader_id)
    return await get_all_evaluations_for_leader(
        leader_id, allowed_employee_ids, session
    )


@router.get("/employee/{employee_id}")
async def get_evaluations_received_by_employee_endpoint(
    employee_id: int,
    viewer_id: int | None = None,
    leader_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Lista as avaliações recebidas por um subordinado (`employee_id`), priorizando a maior hierarquia.
    Se `viewer_id` (ou `leader_id`) for informado, bloqueia acesso à própria avaliação, de pares ou superiores.
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


@router.get("/next-evaluation-date")
async def next_evaluation_date():
    """Retorna a data de início do próximo ciclo semanal de avaliações (próxima segunda-feira)."""
    next_date = await get_next_evaluation_date()
    return {"next_evaluation_date": next_date}


@router.get("/questions")
async def get_questions_endpoint(
    session: AsyncSession = Depends(get_session),
):
    """Retorna as 6 questões de avaliação cadastradas e seus respectivos pesos."""
    result = await session.execute(
        text(
            """
            SELECT
                MIN(question_id) AS id,
                question_text,
                weight
            FROM question
            GROUP BY question_text, weight
            ORDER BY MIN(question_id) ASC
            LIMIT 6
            """
        )
    )
    return result.mappings().all()