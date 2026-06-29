from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import MemoryCreate, MemoryResponse
from app.services.memory_service import MemoryService
from app import models
from app.config import settings

router = APIRouter(prefix="/api/memory", tags=["Memory"])
memory_service = MemoryService(api_key=settings.HINDSIGHT_API_KEY)

@router.post("", response_model=MemoryResponse)
async def create_custom_memory(payload: MemoryCreate, db: Session = Depends(get_db)):
    return await memory_service.store_memory(
        db=db,
        session_id=payload.session_id,
        category=payload.category,
        content=payload.content
    )

@router.get("/search", response_model=List[MemoryResponse])
def search_memories(q: Optional[str] = Query(default="", alias="q"), db: Session = Depends(get_db)):
    """Full-text search across all stored memory entries."""
    if not q or not q.strip():
        return db.query(models.Memory).order_by(models.Memory.created_at.desc()).limit(50).all()
    term = f"%{q.strip()}%"
    return (
        db.query(models.Memory)
        .filter(models.Memory.content.ilike(term) | models.Memory.category.ilike(term))
        .order_by(models.Memory.created_at.desc())
        .limit(50)
        .all()
    )

@router.get("/{session_id}", response_model=List[MemoryResponse])
def get_memories_by_session(session_id: str, db: Session = Depends(get_db)):
    return memory_service.get_memories_by_session(db, session_id=session_id)