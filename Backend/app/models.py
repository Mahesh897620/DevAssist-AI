import datetime
from sqlalchemy import Column, String, DateTime, Boolean, JSON, ForeignKey, Integer
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    category = Column(String)  # 'Bug fixes', 'Architecture decisions', etc.
    content = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RoutingLog(Base):
    __tablename__ = "routing_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    query_type = Column(String)  # 'Simple', 'Debugging', etc.
    model_selected = Column(String)
    reason = Column(String)
    estimated_cost = Column(String)
    latency = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)