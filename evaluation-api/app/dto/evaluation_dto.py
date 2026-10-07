from datetime import datetime
from pydantic import BaseModel, Field


class AnswerDTO(BaseModel):
    """Schema representing an individual question answer with an integer grade from 1 to 4."""

    question_id: int
    grade: int = Field(..., ge=1, le=4, description="Nota inteira entre 1 e 4")
    answer_id: int | None = None
    question_text: str | None = None
    weight: float | None = None


class EvaluationDTO(BaseModel):
    """Schema for submitting or representing an employee performance evaluation."""

    leader_id: int
    lead_id: int
    answers: list[AnswerDTO] = []
    id: int | None = None
    leader_name: str | None = None
    lead_name: str | None = None
    status: str | None = "completed"
    date: datetime | str | None = None


class EvaluationHistoryDTO(BaseModel):
    """Filter and ordering parameters for querying evaluation history."""

    leader_id: int
    order: str = "DATE"
    date_from: datetime | None = None
    date_to: datetime | None = None


class NextEvaluationDateDTO(BaseModel):
    """Optional parameters for querying the next evaluation cycle date."""

    lead_id: int
    leader_id: int | None = None