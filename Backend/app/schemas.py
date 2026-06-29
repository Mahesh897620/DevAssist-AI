from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Chat Schema ---
class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    memory_used: bool
    retrieved_memories: List[Any]
    model_used: str
    estimated_cost: str
    latency: str
    routing_reason: str

# --- Memory Schema ---
class MemoryCreate(BaseModel):
    session_id: str
    category: str  # Bug fixes, Architecture decisions, etc.
    content: str

class MemoryResponse(BaseModel):
    id: int
    session_id: str
    category: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Session Schema ---
class SessionResponse(BaseModel):
    id: str
    user_id: Optional[str]
    created_at: datetime
    message_count: Optional[int] = None   # populated by the router
    class Config:
        from_attributes = True

# --- Message / Chat History Schema ---
class MessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[MessageResponse]

# --- Dashboard Stats Schema ---
class StatsResponse(BaseModel):
    total_sessions: int
    memory_count: int
    estimated_cost_saved: float
    most_used_model: Optional[str] = None
    avg_latency: Optional[float] = None