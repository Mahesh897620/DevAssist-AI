from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {"status": "running", "service": "DevAssist AI Backend"}
