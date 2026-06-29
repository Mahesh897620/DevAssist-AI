from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse, ChatHistoryResponse
from app.config import settings
from app.services.session_service import SessionService
from app.services.memory_service import MemoryService
from app.services.routing_service import RoutingService
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/chat", tags=["Chat Engine"])

@router.post("", response_model=ChatResponse)
async def process_agentic_chat(
    payload: ChatRequest, 
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(SessionService),
    memory_service: MemoryService = Depends(lambda: MemoryService(api_key=settings.HINDSIGHT_API_KEY)),
    routing_service: RoutingService = Depends(RoutingService),
    ai_service: AIService = Depends(AIService)
):
    # 1. Initialize user session or query state tracking
    session_service.get_or_create_session(db, session_id=payload.session_id, user_id=payload.user_id)
    session_service.log_message(db, session_id=payload.session_id, role="user", content=payload.message)
    
    # 2. Extract relative Hindsight engineering historical context
    history = await memory_service.search_relevant_history(payload.session_id, payload.message)
    memory_used = len(history) > 0
    
    # 3. Inject context into prompt template
    constructed_prompt = ""
    if memory_used:
        constructed_prompt += "### RETRIEVED ENGINEERING MEMORIES:\n"
        for entry in history:
            constructed_prompt += f"- [{entry['category']}]: {entry['content']}\n"
        constructed_prompt += "\n"
    constructed_prompt += f"User message: {payload.message}"
    
    # 4. Cascadeflow route determination
    route = await routing_service.determine_route(payload.message)
    
    # 5. Model Generation
    ai_response_text = await ai_service.generate_chat_response(constructed_prompt, route["model_selected"])
    
    # 6. Save records back to history metrics 
    session_service.log_message(db, session_id=payload.session_id, role="assistant", content=ai_response_text)
    session_service.log_routing(db, session_id=payload.session_id, route_details=route)
    
    # Infer standard categories from the text context to auto-generate a hindsight entry
    inferred_category = "Engineering notes"
    if "bug" in payload.message.lower() or "error" in payload.message.lower():
        inferred_category = "Bug fixes"
    elif "architecture" in payload.message.lower():
        inferred_category = "Architecture decisions"
        
    await memory_service.store_memory(db, session_id=payload.session_id, category=inferred_category, content=f"User: {payload.message} -> AI: {ai_response_text[:120]}...")

    return ChatResponse(
        response=ai_response_text,
        memory_used=memory_used,
        retrieved_memories=history,
        model_used=route["model_selected"],
        estimated_cost=route["estimated_cost"],
        latency=route["latency"],
        routing_reason=route["reason"]
    )


@router.get("/{session_id}", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db),
    session_service: SessionService = Depends(SessionService),
):
    messages = session_service.get_messages_by_session(db, session_id=session_id)
    return ChatHistoryResponse(session_id=session_id, messages=messages)