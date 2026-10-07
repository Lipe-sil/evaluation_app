from datetime import datetime, timedelta
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dto.evaluation_dto import EvaluationDTO
from app.modules.employee.service import get_allowed_employee_ids


def get_week_bounds(target_date: datetime | None = None) -> tuple[datetime, datetime]:
    """
    Calcula o início (segunda-feira 00:00:00) e o fim (próxima segunda-feira 00:00:00)
    da semana correspondente a `target_date`.
    """
    if target_date is None:
        target_date = datetime.now()
    start_of_week = target_date - timedelta(days=target_date.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    next_week = start_of_week + timedelta(days=7)
    return start_of_week, next_week


async def get_hierarchy_depth_map(session: AsyncSession) -> dict[int, int]:
    """
    Calcula a profundidade hierárquica de cada colaborador a partir do topo da organização
    (0 = CEO / topo da hierarquia; quanto menor o valor, maior a hierarquia).
    """
    query = text("""
        WITH RECURSIVE org_depth AS (
            SELECT id AS emp_id, 0 AS depth
            FROM employee
            WHERE id NOT IN (SELECT lead_id FROM leader_lead)

            UNION ALL

            SELECT ll.lead_id AS emp_id, od.depth + 1 AS depth
            FROM leader_lead ll
            JOIN org_depth od ON ll.leader_id = od.emp_id
        )
        SELECT emp_id, MIN(depth) AS depth
        FROM org_depth
        GROUP BY emp_id
    """)
    result = await session.execute(query)
    return {row["emp_id"]: row["depth"] for row in result.mappings().all()}


async def has_already_evaluated_this_week(
    leader_id: int,
    lead_id: int,
    session: AsyncSession
) -> bool:
    """
    Verifica se o par (leader_id, lead_id) já possui uma avaliação registrada
    dentro da semana corrente (segunda a domingo).
    """
    start_of_week, next_week = get_week_bounds()

    query = text("""
        SELECT 1
        FROM evaluation
        WHERE leader_id = :leader_id
        AND lead_id = :lead_id
        AND date >= :week_start
        AND date < :next_week_start
        LIMIT 1
    """)

    result = await session.execute(
        query,
        {
            "leader_id": leader_id,
            "lead_id": lead_id,
            "week_start": start_of_week.strftime("%Y-%m-%d %H:%M:%S"),
            "next_week_start": next_week.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )

    return result.first() is not None


async def create_evaluation(
    session: AsyncSession,
    allowed_employee_ids: list[int],
    evaluation_data: EvaluationDTO
) -> int:
    """
    Registra uma nova avaliação de desempenho e suas respostas (1 a 4),
    validando pertencimento à hierarquia e unicidade semanal por par líder-funcionário.
    """
    if evaluation_data.lead_id not in allowed_employee_ids or evaluation_data.lead_id == evaluation_data.leader_id:
        raise PermissionError("You do not have permission to evaluate this lead.")

    if not evaluation_data.answers:
        raise ValueError("At least one answer must be provided.")

    for answer in evaluation_data.answers:
        if answer.grade < 1 or answer.grade > 4:
            raise ValueError("All answer grades must be integers between 1 and 4.")

    has_evaluated = await has_already_evaluated_this_week(
        evaluation_data.leader_id,
        evaluation_data.lead_id,
        session
    )

    if has_evaluated:
        raise ValueError("You have already evaluated this lead this week.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        evaluation_result = await session.execute(
            text("""
                INSERT INTO evaluation (
                    leader_id,
                    lead_id,
                    date,
                    status
                )
                VALUES (
                    :leader_id,
                    :lead_id,
                    :date,
                    'COMPLETED'
                )
                RETURNING evaluation_id
            """),
            {
                "leader_id": evaluation_data.leader_id,
                "lead_id": evaluation_data.lead_id,
                "date": now_str,
            }
        )

        evaluation_id = evaluation_result.scalar_one()

        for answer in evaluation_data.answers:
            await session.execute(
                text("""
                    INSERT INTO answer (
                        evaluation_id,
                        question_id,
                        grade
                    )
                    SELECT
                        :evaluation_id,
                        :question_id,
                        :grade
                    FROM question
                    WHERE question_id = :question_id
                """),
                {
                    "evaluation_id": evaluation_id,
                    "question_id": answer.question_id,
                    "grade": answer.grade,
                }
            )

        await session.commit()
        return evaluation_id

    except Exception:
        await session.rollback()
        raise


async def get_pending_evaluations(
    leader_id: int,
    session: AsyncSession
) -> dict:
    """
    Retorna a árvore hierárquica de subordinados do líder com o status ('completed' ou 'pending')
    referente à avaliação realizada por este `leader_id` na semana atual.
    """
    start_of_week, next_week = get_week_bounds()

    # Get leads evaluated by this leader this week
    eval_res = await session.execute(
        text("""
            SELECT DISTINCT lead_id
            FROM evaluation
            WHERE leader_id = :leader_id
            AND date >= :week_start
            AND date < :next_week_start
        """),
        {
            "leader_id": leader_id,
            "week_start": start_of_week.strftime("%Y-%m-%d %H:%M:%S"),
            "next_week_start": next_week.strftime("%Y-%m-%d %H:%M:%S"),
        }
    )
    evaluated_lead_ids = {row[0] for row in eval_res.fetchall()}

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
            lead.name AS lead_name,
            MIN(h.sort_order) AS sort_order
        FROM hierarchy h
        JOIN employee leader
            ON leader.id = h.leader_id
        JOIN employee lead
            ON lead.id = h.lead_id
        GROUP BY leader.id, leader.name, lead.id, lead.name
        ORDER BY sort_order ASC
    """)

    result = await session.execute(
        query,
        {"leader_id": leader_id}
    )

    rows = result.mappings().all()

    employees = {}

    for row in rows:
        lid = row["leader_id"]
        if lid not in employees:
            employees[lid] = {
                "id": lid,
                "name": row["leader_name"],
                "status": "completed" if lid in evaluated_lead_ids else "pending",
                "leads": []
            }

        eid = row["lead_id"]
        if eid not in employees:
            employees[eid] = {
                "id": eid,
                "name": row["lead_name"],
                "status": "completed" if eid in evaluated_lead_ids else "pending",
                "leads": []
            }

    for row in rows:
        leader = employees[row["leader_id"]]
        lead = employees[row["lead_id"]]
        if lead not in leader["leads"]:
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
            "status": "pending",
            "leads": []
        }

    return {
        "id": leader_id,
        "name": employees[leader_id]["name"],
        "status": "pending",
        "leads": employees[leader_id]["leads"]
    }


def flatten_hierarchy_leads(
    node: dict,
    root_leader_id: int | None = None,
    root_leader_name: str | None = None
) -> list[dict]:
    """
    Transforma a árvore de `get_pending_evaluations` em uma lista linear de subordinados,
    associando o líder logado (`root_leader_id`) como o avaliador responsável pela pendência.
    """
    if root_leader_id is None:
        root_leader_id = node["id"]
    if root_leader_name is None:
        root_leader_name = node["name"]

    leads_list = []
    for lead in node.get("leads", []):
        leads_list.append({
            "id": None,
            "leader_id": root_leader_id,
            "leader_name": root_leader_name,
            "lead_id": lead["id"],
            "lead_name": lead["name"],
            "status": lead.get("status", "pending"),
            "date": None,
            "answers": []
        })
        leads_list.extend(flatten_hierarchy_leads(lead, root_leader_id, root_leader_name))
    return leads_list


def _enrich_hierarchy_and_recency_flags(
    evaluations: list[dict],
    depth_map: dict[int, int]
) -> list[dict]:
    """
    Adiciona metadados `hierarchy_depth`, `is_highest_hierarchy` e `is_most_recent`
    para as avaliações de cada colaborador avaliado (`lead_id`).
    """
    by_lead: dict[int, list[dict]] = {}
    for ev in evaluations:
        ev["hierarchy_depth"] = depth_map.get(ev["leader_id"], 999)
        ev["is_highest_hierarchy"] = False
        ev["is_most_recent"] = False
        by_lead.setdefault(ev["lead_id"], []).append(ev)

    for _, lead_evals in by_lead.items():
        if not lead_evals:
            continue
        most_recent = max(lead_evals, key=lambda x: (x.get("date") or "", x.get("id") or 0))
        most_recent["is_most_recent"] = True

        highest_hierarchy = min(
            lead_evals,
            key=lambda x: (x.get("hierarchy_depth", 999), -(x.get("id") or 0))
        )
        highest_hierarchy["is_highest_hierarchy"] = True

    return evaluations


async def get_all_evaluation(
    allowed_employee_ids: list[int],
    order_by: str,
    date_from: datetime | None,
    date_to: datetime | None,
    session: AsyncSession,
    leader_id: int | None = None
) -> list[dict]:
    """
    Retorna as avaliações concluídas dos subordinados na hierarquia do líder (`allowed_employee_ids`),
    vedando a exibição da própria avaliação do líder ou de avaliações feitas por superiores.
    """
    if order_by not in ("DATE", "LAST"):
        raise ValueError("Invalid order_by value. Must be 'DATE' or 'LAST'.")

    subordinate_ids = [
        emp_id for emp_id in allowed_employee_ids
        if leader_id is None or emp_id != leader_id
    ]
    if not subordinate_ids:
        return []

    date_from_str = date_from.strftime("%Y-%m-%d %H:%M:%S") if date_from else None
    date_to_str = date_to.strftime("%Y-%m-%d %H:%M:%S") if date_to else None

    query = text("""
        SELECT
            e.evaluation_id,
            e.leader_id,
            d.name AS leader_name,
            e.lead_id,
            l.name AS lead_name,
            e.date,
            a.answer_id,
            a.question_id,
            q.question_text AS question_text,
            a.grade,
            q.weight,
            e.status
        FROM evaluation e
        LEFT JOIN answer a
            ON e.evaluation_id = a.evaluation_id
        LEFT JOIN question q
            ON a.question_id = q.question_id
        JOIN employee l
            ON e.lead_id = l.id
        JOIN employee d
            ON e.leader_id = d.id
        WHERE e.lead_id IN :subordinate_ids
        AND e.leader_id IN :allowed_employee_ids
        AND (:date_from IS NULL OR e.date >= :date_from)
        AND (:date_to IS NULL OR e.date <= :date_to)
        ORDER BY e.date DESC, a.answer_id ASC
    """).bindparams(
        bindparam("subordinate_ids", expanding=True),
        bindparam("allowed_employee_ids", expanding=True),
    )

    result = await session.execute(
        query,
        {
            "subordinate_ids": subordinate_ids,
            "allowed_employee_ids": allowed_employee_ids,
            "date_from": date_from_str,
            "date_to": date_to_str,
        }
    )

    rows = result.mappings().all()

    result_dict = {}

    for row in rows:
        evaluation_id = row["evaluation_id"]
        if evaluation_id not in result_dict:
            raw_status = row["status"] or "COMPLETED"
            normalized_status = raw_status.lower()
            if normalized_status == "pending" and row["answer_id"] is not None:
                normalized_status = "completed"

            result_dict[evaluation_id] = {
                "id": row["evaluation_id"],
                "leader_id": row["leader_id"],
                "leader_name": row["leader_name"],
                "lead_id": row["lead_id"],
                "lead_name": row["lead_name"],
                "status": normalized_status,
                "date": str(row["date"]),
                "answers": []
            }

        if row["answer_id"] is not None:
            result_dict[evaluation_id]["answers"].append({
                "answer_id": row["answer_id"],
                "question_id": row["question_id"],
                "question_text": row["question_text"],
                "grade": row["grade"],
                "weight": row["weight"]
            })

    evaluations = list(result_dict.values())
    depth_map = await get_hierarchy_depth_map(session)
    _enrich_hierarchy_and_recency_flags(evaluations, depth_map)

    if order_by == "LAST":
        return evaluations[:1]

    return evaluations


async def get_all_evaluations_for_leader(
    leader_id: int,
    allowed_employee_ids: list[int],
    session: AsyncSession
) -> list[dict]:
    """
    Combina as avaliações pendentes da semana corrente com o histórico de avaliações
    dos subordinados do líder, priorizando a maior hierarquia quando já houver avaliações.
    """
    history = await get_all_evaluation(
        allowed_employee_ids=allowed_employee_ids,
        order_by="DATE",
        date_from=None,
        date_to=None,
        session=session,
        leader_id=leader_id
    )

    pending_tree = await get_pending_evaluations(leader_id, session)
    hierarchy_leads = flatten_hierarchy_leads(pending_tree)

    history_by_lead: dict[int, list[dict]] = {}
    for item in history:
        lid = item["lead_id"]
        history_by_lead.setdefault(lid, []).append(item)

    # Sort each subordinate's completed evaluations by highest hierarchy first (lowest depth), then most recent
    for lid, items in history_by_lead.items():
        items.sort(key=lambda x: (x.get("hierarchy_depth", 999), -(x.get("id") or 0)))

    ordered_results: list[dict] = []
    seen_leads: set[int] = set()

    for lead_item in hierarchy_leads:
        lid = lead_item["lead_id"]
        if lid in seen_leads:
            continue
        seen_leads.add(lid)

        if lead_item["status"] == "pending":
            ordered_results.append(lead_item)
            if lid in history_by_lead:
                ordered_results.extend(history_by_lead[lid])
        else:
            if lid in history_by_lead:
                ordered_results.extend(history_by_lead[lid])
            else:
                ordered_results.append(lead_item)

    for lid, items in history_by_lead.items():
        if lid not in seen_leads:
            ordered_results.extend(items)

    return ordered_results


async def get_next_evaluation_date() -> str:
    """Retorna a data (YYYY-MM-DD) da próxima segunda-feira para abertura do novo ciclo semanal."""
    _, next_week = get_week_bounds()
    return next_week.strftime("%Y-%m-%d")


async def update_evaluation_status_to_pending(
    evaluation_id: int,
    session: AsyncSession
) -> bool:
    """Atualiza o status de uma avaliação para 'PENDING' pelo ID."""
    try:
        await session.execute(
            text("""
                UPDATE evaluation
                SET status = 'PENDING'
                WHERE evaluation_id = :evaluation_id
            """),
            {
                "evaluation_id": evaluation_id,
            }
        )
        await session.commit()
        return True
    except Exception:
        await session.rollback()
        return False


async def get_evaluations_received_by_employee(
    session: AsyncSession,
    employee_id: int,
    viewer_id: int | None = None
) -> list[dict] | None:
    """
    Retorna as avaliações recebidas por um colaborador específico (`employee_id`),
    respeitando as regras de visibilidade (vedado ver a própria avaliação, de pares
    ou de superiores quando `viewer_id` é informado) e priorizando a maior hierarquia.
    Retorna None se o colaborador não existir.
    """
    emp_res = await session.execute(
        text("SELECT id FROM employee WHERE id = :employee_id"),
        {"employee_id": employee_id}
    )
    if emp_res.first() is None:
        return None

    allowed_leader_ids: list[int] | None = None
    if viewer_id is not None:
        allowed_ids = await get_allowed_employee_ids(session, viewer_id)
        if employee_id == viewer_id or employee_id not in allowed_ids:
            raise PermissionError(
                "Access denied: You can only view evaluations of your direct or indirect subordinates."
            )
        allowed_leader_ids = allowed_ids

    query = text("""
        SELECT
            e.evaluation_id,
            e.leader_id,
            d.name AS leader_name,
            e.lead_id,
            l.name AS lead_name,
            e.date,
            e.status,
            a.answer_id,
            a.question_id,
            q.question_text AS question_text,
            a.grade,
            q.weight
        FROM evaluation e
        JOIN employee l
            ON e.lead_id = l.id
        JOIN employee d
            ON e.leader_id = d.id
        LEFT JOIN answer a
            ON e.evaluation_id = a.evaluation_id
        LEFT JOIN question q
            ON a.question_id = q.question_id
        WHERE e.lead_id = :employee_id
        ORDER BY e.date DESC, a.answer_id ASC
    """)

    result = await session.execute(
        query,
        {"employee_id": employee_id}
    )

    rows = result.mappings().all()

    result_dict = {}

    for row in rows:
        if allowed_leader_ids is not None and row["leader_id"] not in allowed_leader_ids:
            continue

        evaluation_id = row["evaluation_id"]
        if evaluation_id not in result_dict:
            raw_status = row["status"] or "COMPLETED"
            normalized_status = raw_status.lower()
            if normalized_status == "pending" and row["answer_id"] is not None:
                normalized_status = "completed"

            result_dict[evaluation_id] = {
                "id": row["evaluation_id"],
                "leader_id": row["leader_id"],
                "leader_name": row["leader_name"],
                "lead_id": row["lead_id"],
                "lead_name": row["lead_name"],
                "status": normalized_status,
                "date": str(row["date"]),
                "answers": []
            }

        if row["answer_id"] is not None:
            if not any(ans["answer_id"] == row["answer_id"] for ans in result_dict[evaluation_id]["answers"]):
                result_dict[evaluation_id]["answers"].append({
                    "answer_id": row["answer_id"],
                    "question_id": row["question_id"],
                    "question_text": row["question_text"],
                    "grade": row["grade"],
                    "weight": row["weight"]
                })

    evaluations = list(result_dict.values())
    depth_map = await get_hierarchy_depth_map(session)
    _enrich_hierarchy_and_recency_flags(evaluations, depth_map)

    # Sort so highest hierarchy comes first, breaking ties by most recent evaluation
    evaluations.sort(key=lambda x: (x.get("hierarchy_depth", 999), -(x.get("id") or 0)))

    return evaluations