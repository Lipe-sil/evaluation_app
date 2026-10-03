from fastapi import FastAPI
from app.modules.employee.router import router as employee_router

app = FastAPI(
    title="FastAPI Project",
    version="1.0.0"
)

app.include_router(employee_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}