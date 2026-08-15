#!/bin/sh
# Starts the backend for E2E tests: migrate, seed demo data, then serve.
# Uses the venv when present, otherwise the system python (CI).
# ADMIN_* configure the bootstrap admin the panel E2E tests log in as.
set -e

if [ -x .venv/bin/python ]; then
    PY=.venv/bin/python
else
    PY=python3
fi

ADMIN_EMAIL=${ADMIN_EMAIL:-admin@theia.test}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin-secret-pass-123}
export ADMIN_EMAIL ADMIN_PASSWORD

"$PY" -m alembic upgrade head
"$PY" -m scripts.seed_demo --force
exec "$PY" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
