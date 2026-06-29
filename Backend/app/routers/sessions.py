from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.schemas import SessionResponse, StatsResponse
from app.services.session_service import SessionService
from app import models

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])
session_service = SessionService()

@router.get("", response_model=List[SessionResponse])
def get_all_active_sessions(db: Session = Depends(get_db)):
    sessions = session_service.get_all_sessions(db)

    # Annotate each session with its message count in one extra query
    counts = dict(
        db.query(models.Message.session_id, func.count(models.Message.id))
        .group_by(models.Message.session_id)
        .all()
    )

    result = []
    for s in sessions:
        result.append(SessionResponse(
            id=s.id,
            user_id=s.user_id,
            created_at=s.created_at,
            message_count=counts.get(s.id, 0),
        ))
    return result


stats_router = APIRouter(prefix="/api/stats", tags=["Stats"])

@stats_router.get("", response_model=StatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_sessions = db.query(models.Session).count()
    memory_count   = db.query(models.Memory).count()

    # ── Cost saved ─────────────────────────────────────────────────────────
    PREMIUM_COST = 0.0025
    routing_logs = db.query(models.RoutingLog).all()
    actual_cost  = 0.0
    for log in routing_logs:
        try:
            actual_cost += float(log.estimated_cost.replace("$", ""))
        except (ValueError, AttributeError):
            continue
    estimated_cost_saved = max((PREMIUM_COST * len(routing_logs)) - actual_cost, 0.0)

    # ── Most-used model ────────────────────────────────────────────────────
    most_used_model = None
    if routing_logs:
        from collections import Counter
        model_counts = Counter(log.model_selected for log in routing_logs if log.model_selected)
        if model_counts:
            most_used_model = model_counts.most_common(1)[0][0]

    # ── Average latency (ms) ───────────────────────────────────────────────
    avg_latency = None
    latencies = []
    for log in routing_logs:
        try:
            ms = float(str(log.latency).replace("ms", "").strip())
            latencies.append(ms)
        except (ValueError, AttributeError):
            continue
    if latencies:
        avg_latency = round(sum(latencies) / len(latencies), 2)

    return StatsResponse(
        total_sessions=total_sessions,
        memory_count=memory_count,
        estimated_cost_saved=estimated_cost_saved,
        most_used_model=most_used_model,
        avg_latency=avg_latency,
    )