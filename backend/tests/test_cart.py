from helpers import cookie_header, new_cart

from fastapi.testclient import TestClient


def test_cart_absent_without_cookie(seeded):
    body = seeded.get("/api/cart").json()
    assert body == {"cart_id": "", "total_items": 0, "items": []}


def test_create_cart_returns_empty_cart_and_sets_cookie(seeded):
    response = seeded.post("/api/cart")
    assert response.status_code == 201
    body = response.json()
    assert body["total_items"] == 0
    assert body["items"] == []
    assert "cart_id" in response.headers.get("set-cookie", "")


def test_add_orderable_product_and_increment_quantity(seeded):
    cart_id = new_cart(seeded)

    first = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    )
    assert first.status_code == 201
    item = first.json()["items"][0]
    assert item["name"] == "High Performance Digital Imaging System VK-2s"
    assert item["price_gs"] == 1000000
    assert item["price_usd"] == "142.86"
    assert item["quantity"] == 1
    assert first.json()["total_items"] == 1

    second = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    )
    assert second.status_code == 201
    assert second.json()["items"][0]["quantity"] == 2
    assert second.json()["total_items"] == 2


def test_add_respects_explicit_quantity(seeded):
    cart_id = new_cart(seeded)
    response = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s", "quantity": 3},
        headers=cookie_header(cart_id),
    )
    assert response.status_code == 201
    assert response.json()["items"][0]["quantity"] == 3


def test_quote_only_product_cannot_be_added(seeded):
    cart_id = new_cart(seeded)
    response = seeded.post(
        "/api/cart/items",
        json={"product_slug": "hhou-7040-refraction-units"},
        headers=cookie_header(cart_id),
    )
    assert response.status_code == 409
    body = seeded.get("/api/cart", headers=cookie_header(cart_id)).json()
    assert body["items"] == []


def test_quote_only_rejection_does_not_create_a_cart(seeded):
    response = seeded.post(
        "/api/cart/items",
        json={"product_slug": "hhou-7040-refraction-units"},
    )
    assert response.status_code == 409
    assert "set-cookie" not in response.headers
    assert seeded.get("/api/cart").json()["items"] == []


def test_unknown_product_returns_404(seeded):
    cart_id = new_cart(seeded)
    response = seeded.post(
        "/api/cart/items",
        json={"product_slug": "no-such-product"},
        headers=cookie_header(cart_id),
    )
    assert response.status_code == 404


def test_add_creates_cart_when_cookie_missing(seeded):
    response = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
    )
    assert response.status_code == 201
    assert response.json()["total_items"] == 1
    assert "cart_id" in response.headers.get("set-cookie", "")


def test_update_quantity(seeded):
    cart_id = new_cart(seeded)
    item_id = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    ).json()["items"][0]["id"]

    response = seeded.patch(
        f"/api/cart/items/{item_id}", json={"quantity": 5}, headers=cookie_header(cart_id)
    )
    assert response.status_code == 200
    assert response.json()["items"][0]["quantity"] == 5
    assert response.json()["total_items"] == 5


def test_update_quantity_rejects_less_than_one(seeded):
    cart_id = new_cart(seeded)
    item_id = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    ).json()["items"][0]["id"]

    assert (
        seeded.patch(
            f"/api/cart/items/{item_id}", json={"quantity": 0}, headers=cookie_header(cart_id)
        ).status_code
        == 422
    )


def test_remove_item(seeded):
    cart_id = new_cart(seeded)
    item_id = seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    ).json()["items"][0]["id"]

    response = seeded.delete(f"/api/cart/items/{item_id}", headers=cookie_header(cart_id))
    assert response.status_code == 204
    body = seeded.get("/api/cart", headers=cookie_header(cart_id)).json()
    assert body["items"] == []
    assert body["total_items"] == 0


def test_update_or_remove_item_not_in_cart_returns_404(seeded):
    cart_id = new_cart(seeded)
    assert (
        seeded.patch(
            "/api/cart/items/999", json={"quantity": 1}, headers=cookie_header(cart_id)
        ).status_code
        == 404
    )
    assert (
        seeded.delete("/api/cart/items/999", headers=cookie_header(cart_id)).status_code == 404
    )


def test_unknown_cart_id_reads_as_empty(seeded):
    body = seeded.get("/api/cart", headers=cookie_header("00000000-0000-0000-0000-000000000000")).json()
    assert body["total_items"] == 0
