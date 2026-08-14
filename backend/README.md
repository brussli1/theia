# Theia backend

FastAPI API for the Theia catalog and commerce. PostgreSQL via SQLAlchemy (async).

## Run locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirement.txt
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/theia"
uvicorn main:app --reload
```

## Structure

- `main.py` — app entry point
- `core/` — config + database
- `models/` — SQLAlchemy models + Pydantic schemas
- `crud/` — data access
- `routers/` — API routes
