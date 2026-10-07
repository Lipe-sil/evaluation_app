from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.modules.leader.service import get_array_of_leader_lead, get_leader_lead


router = APIRouter(
    prefix="/leader",
    tags=["leader"]
)


@router.get("/{leader_id}/leads")
async def get_leads(
    leader_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Retorna a árvore hierárquica recursiva de subordinados diretos e indiretos de um líder."""
    return await get_leader_lead(session, leader_id)


@router.get("/{leader_id}/leads/array")
async def get_leads_array(
    leader_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Retorna a lista linear (flat array) de todos os subordinados diretos e indiretos de um líder."""
    return await get_array_of_leader_lead(session, leader_id)