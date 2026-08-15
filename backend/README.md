# Theia backend

FastAPI API for the Theia catalog and commerce. PostgreSQL via SQLAlchemy (async), Alembic for migrations.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
export DATABASE_URL="postgresql+asyncpg://theia:theia@localhost:5432/theia"
uvicorn app.main:app --reload
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Migrations

```bash
alembic upgrade head
```

## Structure

- `app/main.py` — app entry point
- `app/api/` — routers (health, and later catalog, commerce, admin)
- `app/core/` — config + database
- `app/models/` — SQLAlchemy models + Pydantic schemas (landed in ticket #4)
- `tests/` — HTTP-API-seam tests (pytest + httpx)
