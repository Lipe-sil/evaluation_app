from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import SessionLocal
from app.database.session import get_session
from app.modules.employee.router import router as employee_router
from app.modules.leader.router import router as leader_router
from app.modules.evaluation.router import router as evaluation_router
from app.modules.evaluation.service import get_evaluations_received_by_employee


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with SessionLocal() as session:
            await session.execute(
                text("""
                    UPDATE answer
                    SET question_id = (
                        SELECT MIN(q2.question_id)
                        FROM question q2
                        JOIN question q1 ON q1.question_text = q2.question_text
                        WHERE q1.question_id = answer.question_id
                    )
                    WHERE question_id IN (
                        SELECT question_id FROM question
                        WHERE question_id NOT IN (
                            SELECT MIN(question_id) FROM question GROUP BY question_text
                        )
                    )
                """)
            )
            await session.execute(
                text("""
                    DELETE FROM question
                    WHERE question_id NOT IN (
                        SELECT MIN(question_id)
                        FROM question
                        GROUP BY question_text
                    )
                """)
            )
            await session.commit()
    except Exception as e:
        print(f"Warning during question deduplication: {e}")

    yield


app = FastAPI(
    title="Evaluation API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee_router)
app.include_router(leader_router)
app.include_router(evaluation_router)


@app.get("/health")
def health_check():
    """Verifica a disponibilidade e saúde da API."""
    return {"status": "ok"}


@app.get("/evaluations/employee/{employee_id}", tags=["evaluation"])
async def evaluations_employee_plural_alias(
    employee_id: int,
    viewer_id: int | None = None,
    leader_id: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Alias plural para consulta das avaliações recebidas por um colaborador subordinado."""
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