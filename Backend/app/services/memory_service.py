from typing import List, Dict, Any
import asyncio
from sqlalchemy.orm import Session
from app import models

class HindsightSDKMock:
    """
    Production-ready SDK Wrapper fallback simulating semantic retrieval 
    and vector memory categorization for DevAssist AI.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def search_memory(self, session_id: str, query: str) -> List[Dict[str, Any]]:
        await asyncio.sleep(0.1) # Simulate network latency
        # Simulated semantic lookups for specific engineering keywords
        query_lower = query.lower()
        if "bug" in query_lower or "error" in query_lower or "fix" in query_lower:
            return [{
                "category": "Bug fixes",
                "content": "Past fix: Resolved connection pool starvation by enforcing 'check_same_thread=False' on SQLite engine initialization."
            }]
        elif "architecture" in query_lower or "design" in query_lower:
            return [{
                "category": "Architecture decisions",
                "content": "Decision: Adopted a modular service-router pattern to decouple database layers from routing optimization logic."
            }]
        return []

    async def save_memory(self, session_id: str, category: str, content: str) -> bool:
        await asyncio.sleep(0.05) # Simulate network latency
        return True

class MemoryService:
    def __init__(self, api_key: str):
        self.sdk = HindsightSDKMock(api_key=api_key)

    async def search_relevant_history(self, session_id: str, query: str) -> List[Dict[str, Any]]:
        return await self.sdk.search_memory(session_id, query)

    async def store_memory(self, db: Session, session_id: str, category: str, content: str) -> models.Memory:
        # 1. Save to Hindsight SDK platform
        await self.sdk.save_memory(session_id, category, content)
        
        # 2. Persist locally to SQLite database
        db_memory = models.Memory(
            session_id=session_id,
            category=category,
            content=content
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)
        return db_memory

    def get_memories_by_session(self, db: Session, session_id: str) -> List[models.Memory]:
        return db.query(models.Memory).filter(models.Memory.session_id == session_id).all()