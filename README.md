# Theia

E-commerce catalog and storefront for ophthalmological equipment, sold to professionals in Paraguay and abroad. See `CONTEXT.md` for the domain glossary.

## Layout

- `backend/` — FastAPI API (catalog, commerce, admin), PostgreSQL via SQLAlchemy (async) + Alembic.
- `frontend/` — Next.js 14 (App Router) storefront, TypeScript + Tailwind.
- `docs/` — agent configuration (`docs/agents/`), research notes (`docs/research/`).
- `compose.yaml` — Postgres + backend + frontend together.

## Run with Docker

```bash
docker compose up
```

- Frontend: http://localhost:3000 (renders backend health)
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local development

- Backend: see `backend/README.md`.
- Frontend: `cd frontend && npm install && npm run dev`.

## Agent skills

See `AGENTS.md`.
