"""Test helpers shared by the HTTP-seam test modules."""

from fastapi.testclient import TestClient

REGISTER_PAYLOAD = {
    "name": "Juan Pérez",
    "email": "customer@example.com",
    "password": "secret-pass-123",
}


def cookie_header(cart_id: str) -> dict[str, str]:
    return {"cookie": f"cart_id={cart_id}"}


def auth_headers(token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}"}


def new_cart(client: TestClient) -> str:
    response = client.post("/api/cart")
    assert response.status_code == 201
    return response.json()["cart_id"]


def register(client: TestClient, **overrides) -> dict:
    """Registers an account and returns the AuthOut body (token + user)."""
    response = client.post("/api/auth/register", json={**REGISTER_PAYLOAD, **overrides})
    assert response.status_code == 201
    return response.json()
