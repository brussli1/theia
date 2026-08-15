"""Test helpers shared by the HTTP-seam test modules."""

import os

import psycopg2
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


def promote_to_admin(email: str) -> None:
    """Grants the admin role to an existing account (registration never can)."""
    with psycopg2.connect(os.environ["DATABASE_URL_SYNC"]) as conn:
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET role = 'admin' WHERE email = %s", (email,))
            assert cursor.rowcount == 1, f"no user with email {email}"


def admin_headers(client: TestClient, email: str = "admin@example.com") -> dict[str, str]:
    """Registers an account, promotes it to admin, and returns its headers."""
    body = register(client, email=email, name="Administrator")
    promote_to_admin(body["user"]["email"])
    return auth_headers(body["token"])
