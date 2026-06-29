# DevAssist AI - Persistent Engineering Knowledge Agent

DevAssist AI is an AI-powered engineering assistant that remembers previous engineering discussions and intelligently routes AI requests to the right model tier based on query complexity.

This repository contains the production-ready backend for the DevAssist AI project.

> **Note:** The "Hindsight" memory layer and "cascadeflow" routing layer are currently implemented as
> in-process mock services (`HindsightSDKMock` in `memory_service.py` and `CascadeFlowMock` in
> `routing_service.py`). They simulate semantic memory retrieval and intent-based model routing using
> keyword rules, with realistic latency, so the API contract and UI work end-to-end without needing
> external SDK accounts. Swap these classes out for the real SDKs when you're ready to go to production.

## Tech Stack

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy & SQLite
- Pydantic
- python-dotenv
- httpx
- Groq API (or any OpenAI-compatible API)

## Folder Structure

```
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── config.py
│   ├── models.py
│   ├── schemas.py
│   ├── routers/
│   │   ├── chat.py
│   │   ├── memory.py
│   │   ├── sessions.py
│   │   └── health.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── memory_service.py
│   │   ├── routing_service.py
│   │   └── session_service.py
│   └── utils/
├── requirements.txt
├── .env.example
└── README.md
```

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd backend
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    # On Windows, use: venv\Scripts\activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Environment Variables

Create a `.env` file in the `backend` directory by copying the example file:

```bash
cp .env.example .env
```

Then, fill in the required values in the `.env` file:

-   `GROQ_API_KEY`: Your API key for the Groq service.
-   `HINDSIGHT_API_KEY`: Placeholder key for the mock memory service (any non-empty string works; not yet validated against a real API).
-   `DATABASE_URL`: The connection string for your database. For SQLite, the default is `sqlite:///./devassist.db`.
-   `PORT` / `HOST`: Where the FastAPI server binds (defaults: `8000` / `0.0.0.0`).

## Running the Application

1.  **Start the backend server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The application will be running at `http://127.0.0.1:8000`.

2.  **Access the API documentation:**
    Navigate to `http://127.0.0.1:8000/docs` in your browser to see the interactive Swagger UI documentation.

## API Documentation

### Health Endpoint

-   **GET** `/health`
    -   **Description:** Checks the health of the application.
    -   **Success Response (200):**
        ```json
        {
          "status": "running"
        }
        ```

### Chat Endpoint

-   **POST** `/api/chat`
    -   **Description:** Handles a user's chat message, processes it through the AI pipeline, and returns a response.
    -   **Request Body:**
        ```json
        {
          "session_id": "string (optional)",
          "user_id": "string",
          "message": "string"
        }
        ```
    -   **Success Response (200):**
        ```json
        {
          "response": "The generated response from the AI model.",
          "memory_used": true,
          "retrieved_memories": [
            {
              "category": "Bug fixes",
              "content": "Past fix: Resolved connection pool starvation..."
            }
          ],
          "model_used": "openai/gpt-oss-120b",
          "estimated_cost": "$0.0000",
          "latency": "0.02ms",
          "routing_reason": "Simple conceptual explanation matching rule: Route to Free/OSS model tier."
        }
        ```

-   **GET** `/api/chat/{session_id}`
    -   **Description:** Returns the full message history (user + assistant turns) for a session, in chronological order.
    -   **Success Response (200):**
        ```json
        {
          "session_id": "session_123",
          "messages": [
            { "id": 1, "session_id": "session_123", "role": "user", "content": "...", "created_at": "2026-01-01T00:00:00" },
            { "id": 2, "session_id": "session_123", "role": "assistant", "content": "...", "created_at": "2026-01-01T00:00:01" }
          ]
        }
        ```

### Memory Endpoint

-   **POST** `/api/memory`
    -   **Description:** Manually creates a memory entry for a session.
    -   **Request Body:**
        ```json
        { "session_id": "string", "category": "string", "content": "string" }
        ```
    -   **Success Response (200):** Returns the created `MemoryResponse` object (`id`, `session_id`, `category`, `content`, `created_at`).

-   **GET** `/api/memory/{session_id}`
    -   **Description:** Returns all stored memory entries for a session, as a list.
    -   **Success Response (200):**
        ```json
        [
          { "id": 1, "session_id": "session_123", "category": "Bug fixes", "content": "...", "created_at": "2026-01-01T00:00:00" }
        ]
        ```

### Sessions Endpoint

-   **GET** `/api/sessions`
    -   **Description:** Returns all sessions, most recent first.
    -   **Success Response (200):**
        ```json
        [
          { "id": "session_123", "user_id": "user_abc", "created_at": "2026-01-01T00:00:00" }
        ]
        ```

### Stats Endpoint

-   **GET** `/api/stats`
    -   **Description:** Aggregate dashboard metrics: total sessions, total memory entries, and estimated cost saved by cascadeflow's routing vs. always using the premium model tier.
    -   **Success Response (200):**
        ```json
        { "total_sessions": 3, "memory_count": 7, "estimated_cost_saved": 0.0123 }
        ```

## Running the Frontend

The frontend is a plain HTML/CSS/JavaScript app (no build step or `npm install` required).

1.  From the `frontend/` directory, serve the files with any static file server, for example:
    ```bash
    cd frontend
    python -m http.server 5173
    ```
2.  Open `http://localhost:5173` in your browser. Make sure the backend is also running on `http://localhost:8000` — the frontend talks to it directly via `fetch` (see `API_BASE_URL` in `script.js`).
3.  If you serve the frontend from a different host/port than `localhost:5173`/`localhost:8000`, update `API_BASE_URL` in `script.js` accordingly.