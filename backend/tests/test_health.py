import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client(monkeypatch):
    async def fake_ok() -> bool:
        return True

    monkeypatch.setattr("app.api.health.database_ok", fake_ok)
    with TestClient(app) as test_client:
        yield test_client


def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_health_reports_status_ok(client):
    response = client.get("/health")
    assert response.json()["status"] == "ok"


def test_health_reports_database_ok(client):
    response = client.get("/health")
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_reports_database_unavailable(monkeypatch):
    async def fake_down() -> bool:
        return False

    monkeypatch.setattr("app.api.health.database_ok", fake_down)
    with TestClient(app) as test_client:
        response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "degraded", "database": "unavailable"}
