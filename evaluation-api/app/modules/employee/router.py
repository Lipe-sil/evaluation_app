from fastapi import APIRouter

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


@router.get("/")
def get_employees():
    return {
        "employees": ["Alice", "Bob", "Charlie"]
    }