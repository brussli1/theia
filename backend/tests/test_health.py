from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_reports_database_ok(monkeypatch):
    async def fake_ok() -> bool:
        return True

    monkeypatch.setattr("app.api.health.database_ok", fake_ok)
    response = client.get("/health")
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_reports_database_unavailable(monkeypatch):
    async def fake_down() -> bool:
        return False

    monkeypatch.setattr("app.api.health.database_ok", fake_down)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "degraded", "database": "unavailable"}
