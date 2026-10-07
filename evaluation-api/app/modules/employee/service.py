from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.leader.service import get_leader_lead


async def get_allowed_employee_ids(
    session: AsyncSession,
    user_id: int
) -> list[int]:
    """
    Retorna a lista de IDs da subárvore hierárquica do líder (`user_id`),
    incluindo o próprio `user_id` na primeira posição e todos os seus subordinados.
    """
    hierarchy = await get_leader_lead(session, user_id)

    return get_employee_ids(hierarchy)


def get_employee_ids(employee: dict) -> list[int]:
    """Extrai recursivamente todos os IDs de uma árvore hierárquica de funcionários."""
    ids = [employee["id"]]

    for lead in employee["leads"]:
        ids.extend(get_employee_ids(lead))

    return ids
