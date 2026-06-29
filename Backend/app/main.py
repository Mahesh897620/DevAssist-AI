import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import settings
from .database import engine, Base
from .routers import health, sessions, memory, chat

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DevAssist AI Backend",
    description="Persistent Engineering Knowledge Agent API layer.",
    version="1.0.0"
)

# CORS — kept open for dev convenience; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API routers — must be registered BEFORE the catch-all SPA route
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(sessions.stats_router)
app.include_router(memory.router)
app.include_router(chat.router)

# ---------------------------------------------------------------------------
# Static file serving — serve the Vite-built React app
# ---------------------------------------------------------------------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.isdir(STATIC_DIR):
    # Serve /assets/* directly (JS/CSS/images)
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    INDEX_HTML = os.path.join(STATIC_DIR, "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: serve index.html so React Router handles client-side navigation."""
        return FileResponse(INDEX_HTML)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)