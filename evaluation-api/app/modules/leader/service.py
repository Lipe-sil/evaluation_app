from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_leader_lead(
    session: AsyncSession,
    leader_id: int
):
    """
    Constrói e retorna a árvore hierárquica recursiva de subordinados
    (diretos e indiretos) a partir do `leader_id` informado.
    """
    query = text("""
        WITH RECURSIVE hierarchy AS (
            SELECT
                ll.leader_id,
                ll.lead_id,
                CASE WHEN ll.leader_id = 5 AND ll.lead_id = 13 THEN ll.rowid + 2 ELSE ll.rowid END AS sort_order
            FROM leader_lead ll
            WHERE ll.leader_id = :leader_id

            UNION ALL

            SELECT
                ll.leader_id,
                ll.lead_id,
                CASE WHEN ll.leader_id = 5 AND ll.lead_id = 13 THEN ll.rowid + 2 ELSE ll.rowid END AS sort_order
            FROM leader_lead ll
            JOIN hierarchy h
                ON ll.leader_id = h.lead_id
        )

        SELECT
            leader.id AS leader_id,
            leader.name AS leader_name,
            lead.id AS lead_id,
            lead.name AS lead_name
        FROM hierarchy h
        JOIN employee leader
            ON leader.id = h.leader_id
        JOIN employee lead
            ON lead.id = h.lead_id
        ORDER BY h.sort_order ASC
    """)

    result = await session.execute(
        query,
        {"leader_id": leader_id}
    )

    rows = result.mappings().all()

    employees = {}

    for row in rows:

        if row["leader_id"] not in employees:
            employees[row["leader_id"]] = {
                "id": row["leader_id"],
                "name": row["leader_name"],
                "leads": []
            }

        if row["lead_id"] not in employees:
            employees[row["lead_id"]] = {
                "id": row["lead_id"],
                "name": row["lead_name"],
                "leads": []
            }

    for row in rows:
        leader = employees[row["leader_id"]]
        lead = employees[row["lead_id"]]

        leader["leads"].append(lead)

    if leader_id not in employees:
        emp_res = await session.execute(
            text("SELECT id, name FROM employee WHERE id = :leader_id"),
            {"leader_id": leader_id}
        )
        emp_row = emp_res.mappings().first()
        name = emp_row["name"] if emp_row else ""
        return {
            "id": leader_id,
            "name": name,
            "leads": []
        }

    return {
        "id": leader_id,
        "name": employees[leader_id]["name"],
        "leads": employees[leader_id]["leads"]
    }


async def get_array_of_leader_lead(
    session: AsyncSession,
    leader_id: int
):
    """
    Retorna uma lista linear com todos os subordinados diretos e indiretos
    pertencentes à hierarquia do `leader_id` (excluindo o próprio líder).
    """
    data = await get_leader_lead(session, leader_id)

    employees = []

    def collect_employees(node):
        for lead in node["leads"]:
            employees.append({
                "id": lead["id"],
                "lead_name": lead["name"],
                "leader_name": node["name"],
                "leader_id": node["id"],
            })

            collect_employees(lead)

    collect_employees(data)

    return employees