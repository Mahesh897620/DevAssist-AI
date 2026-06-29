import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DATABASE_URL: str = "sqlite:///./devassist.db"
    GROQ_API_KEY: str = "mock-key"
    HINDSIGHT_API_KEY: str = "mock-key"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()