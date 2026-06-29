from typing import List
from sqlalchemy.orm import Session
from app import models

class SessionService:
    def get_or_create_session(self, db: Session, session_id: str, user_id: str) -> models.Session:
        # Enforce user profile exists
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            user = models.User(id=user_id)
            db.add(user)
            db.commit()

        # Enforce conversational workspace container session exists
        session = db.query(models.Session).filter(models.Session.id == session_id).first()
        if not session:
            session = models.Session(id=session_id, user_id=user_id)
            db.add(session)
            db.commit()
            db.refresh(session)
        return session

    def log_message(self, db: Session, session_id: str, role: str, content: str) -> models.Message:
        db_msg = models.Message(session_id=session_id, role=role, content=content)
        db.add(db_msg)
        db.commit()
        db.refresh(db_msg)
        return db_msg

    def log_routing(self, db: Session, session_id: str, route_details: dict) -> models.RoutingLog:
        db_log = models.RoutingLog(
            session_id=session_id,
            query_type=route_details["query_type"],
            model_selected=route_details["model_selected"],
            reason=route_details["reason"],
            estimated_cost=route_details["estimated_cost"],
            latency=route_details["latency"]
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    def get_all_sessions(self, db: Session) -> List[models.Session]:
        return db.query(models.Session).order_by(models.Session.created_at.desc()).all()

    def get_messages_by_session(self, db: Session, session_id: str) -> List[models.Message]:
        return (
            db.query(models.Message)
            .filter(models.Message.session_id == session_id)
            .order_by(models.Message.created_at.asc())
            .all()
        )