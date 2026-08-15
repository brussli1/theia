"""Test helpers shared by the HTTP-seam test modules."""

from fastapi.testclient import TestClient


def cookie_header(cart_id: str) -> dict[str, str]:
    return {"cookie": f"cart_id={cart_id}"}


def new_cart(client: TestClient) -> str:
    response = client.post("/api/cart")
    assert response.status_code == 201
    return response.json()["cart_id"]
