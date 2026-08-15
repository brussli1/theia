"""Admin panel (#15): role-gated catalog management at the HTTP seam.

The bootstrap helper is exercised against an isolated engine (never the app's
shared pool — a connection attached to a dead event loop breaks later
requests, see the seeding note in conftest).
"""

import asyncio
import base64
import os
import re
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.admin import ensure_admin
from app.core.config import settings
from helpers import admin_headers, auth_headers, cookie_header, new_cart, register

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def make_order(client) -> dict:
    """A Western Union checkout through the HTTP seam: cart → order."""
    cart_id = new_cart(client)
    client.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    )
    response = client.post(
        "/api/orders",
        json={
            "email": "customer@example.com",
            "phone": "+595 981 123 456",
            "delivery_type": "local",
            "payment_method": "western_union",
            "name": "Juan Pérez",
            "address": "Av. Mariscal López 1234",
            "city": "Asunción",
            "country": "Paraguay",
        },
        headers=cookie_header(cart_id),
    )
    assert response.status_code == 201
    return response.json()


def make_quote(client) -> dict:
    """A used-equipment quote request through the HTTP seam."""
    response = client.post(
        "/api/quotes",
        json={
            "kind": "used",
            "name": "María González",
            "email": "maria@example.com",
            "phone": "+595 981 654 321",
            "message": "¿Tienen un tonómetro usado?",
        },
    )
    assert response.status_code == 201
    return response.json()


@asynccontextmanager
async def _isolated_db():
    """A throwaway engine on the calling test's event loop, so `asyncio.run`
    here never touches the shared engine's pooled connections."""
    engine = create_async_engine(os.environ["DATABASE_URL"])
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        yield factory
    finally:
        await engine.dispose()


def test_register_never_grants_admin(seeded):
    body = register(seeded)
    assert body["user"]["role"] == "customer"
    me = seeded.get("/api/auth/me", headers=auth_headers(body["token"])).json()
    assert me["role"] == "customer"


def test_admin_endpoints_require_an_admin_token(seeded):
    assert seeded.get("/api/admin/products").status_code == 401
    customer = register(seeded)
    assert (
        seeded.get("/api/admin/products", headers=auth_headers(customer["token"])).status_code
        == 403
    )


def test_login_returns_the_admin_role(seeded):
    admin_headers(seeded)
    response = seeded.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "secret-pass-123"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"


def test_create_and_edit_product(seeded):
    headers = admin_headers(seeded)
    payload = {
        "name": "  Nuevo Refractómetro ",
        "description": "Digital refractometer.",
        "price_gs": 25000000,
        "price_usd": 3571.43,
        "available": True,
        "orderable": True,
        "certifications": [" ce ", "CE"],
        "images": [],
        "specifications": [{"key": "Type", "value": "Auto"}],
        "category_id": 1,
        "brand_id": 2,
    }
    created = seeded.post("/api/admin/products", json=payload, headers=headers)
    assert created.status_code == 201
    body = created.json()
    assert body["slug"] == "nuevo-refractometro"
    assert body["certifications"] == ["CE"]
    assert body["price_usd"] == "3571.43"
    assert body["specifications"] == [{"key": "Type", "value": "Auto"}]

    duplicate = seeded.post(
        "/api/admin/products", json={**payload, "name": "Nuevo Refractómetro"}, headers=headers
    )
    assert duplicate.status_code == 201
    assert duplicate.json()["slug"] == "nuevo-refractometro-2"

    edited = seeded.put(
        f"/api/admin/products/{body['id']}",
        json={**payload, "name": "Refractómetro Renovado", "available": False},
        headers=headers,
    )
    assert edited.status_code == 200
    assert edited.json()["available"] is False
    assert edited.json()["slug"] == "nuevo-refractometro"
    assert edited.json()["category_name"] == "ANALYTICAL INSTRUMENTS"
    assert edited.json()["brand_name"] == "Huvitz"

    listed = seeded.get("/api/admin/products", headers=headers).json()
    first = next(product for product in listed if product["id"] == body["id"])
    assert first["name"] == "Refractómetro Renovado"
    assert first["available"] is False

    # The storefront still serves the deactivated product, flagged unavailable.
    public = seeded.get("/api/products/nuevo-refractometro").json()
    assert public["available"] is False


def test_create_product_rejects_unknown_brand_and_category(seeded):
    headers = admin_headers(seeded)
    payload = {"name": "Mínimo", "price_gs": 1, "price_usd": 1}
    assert (
        seeded.post(
            "/api/admin/products", json={**payload, "brand_id": 999}, headers=headers
        ).status_code
        == 422
    )
    assert (
        seeded.post(
            "/api/admin/products", json={**payload, "category_id": 999}, headers=headers
        ).status_code
        == 422
    )


def test_category_crud(seeded):
    headers = admin_headers(seeded)
    created = seeded.post(
        "/api/admin/categories", json={"name": "Lámparas de Hendidura"}, headers=headers
    )
    assert created.status_code == 201
    assert created.json()["slug"] == "lamparas-de-hendidura"

    duplicate = seeded.post(
        "/api/admin/categories", json={"name": "Lámparas de Hendidura"}, headers=headers
    )
    assert duplicate.json()["slug"] == "lamparas-de-hendidura-2"

    renamed = seeded.put(
        f"/api/admin/categories/{created.json()['id']}",
        json={"name": "Lámparas LED"},
        headers=headers,
    )
    assert renamed.status_code == 200
    assert renamed.json()["slug"] == "lamparas-de-hendidura"

    # Deleting a seeded category uncategorizes its products (SET NULL).
    deleted = seeded.delete("/api/admin/categories/1", headers=headers)
    assert deleted.status_code == 204
    product = next(
        item for item in seeded.get("/api/admin/products", headers=headers).json()
        if item["id"] == 1
    )
    assert product["category_id"] is None
    assert product["category_name"] is None

    assert seeded.delete("/api/admin/categories/999", headers=headers).status_code == 404


def test_brand_crud(seeded):
    headers = admin_headers(seeded)
    created = seeded.post("/api/admin/brands", json={"name": "Topcon"}, headers=headers)
    assert created.status_code == 201
    assert created.json()["slug"] == "topcon"

    duplicate = seeded.post("/api/admin/brands", json={"name": "Topcon"}, headers=headers)
    assert duplicate.json()["slug"] == "topcon-2"

    renamed = seeded.put(
        f"/api/admin/brands/{created.json()['id']}",
        json={"name": "Topcon Medical"},
        headers=headers,
    )
    assert renamed.status_code == 200
    assert renamed.json()["slug"] == "topcon"

    deleted = seeded.delete("/api/admin/brands/1", headers=headers)
    assert deleted.status_code == 204
    product = next(
        item for item in seeded.get("/api/admin/products", headers=headers).json()
        if item["id"] == 1
    )
    assert product["brand_id"] is None
    assert product["brand_name"] is None

    assert seeded.delete("/api/admin/brands/999", headers=headers).status_code == 404


def test_collections_can_be_curated(seeded):
    headers = admin_headers(seeded)
    replaced = seeded.put(
        "/api/admin/collections/carousel", json={"product_ids": [3, 1, 2]}, headers=headers
    )
    assert replaced.status_code == 200
    assert replaced.json() == {"type": "carousel", "product_ids": [3, 1, 2]}

    # Order is preserved in the storefront endpoint.
    carousel = next(
        collection
        for collection in seeded.get("/api/collections").json()
        if collection["type"] == "carousel"
    )
    assert [product["id"] for product in carousel["products"]] == [3, 1, 2]

    deduped = seeded.put(
        "/api/admin/collections/promo", json={"product_ids": [2, 2, 1]}, headers=headers
    )
    assert deduped.json()["product_ids"] == [2, 1]

    assert (
        seeded.put(
            "/api/admin/collections/popular", json={"product_ids": [999]}, headers=headers
        ).status_code
        == 422
    )

    listed = seeded.get("/api/admin/collections", headers=headers).json()
    assert {collection["type"] for collection in listed} == {"carousel", "popular", "promo"}


def test_collection_type_is_created_when_missing(client):
    headers = admin_headers(client)
    created = client.put(
        "/api/admin/collections/carousel", json={"product_ids": []}, headers=headers
    )
    assert created.status_code == 200
    assert created.json() == {"type": "carousel", "product_ids": []}
    assert client.get("/api/admin/collections", headers=headers).json() == [
        {"type": "carousel", "product_ids": []}
    ]


def test_upload_and_serve_image(seeded):
    headers = admin_headers(seeded)
    first = seeded.post(
        "/api/admin/images", files={"file": ("pixel.png", PNG_1PX, "image/png")}, headers=headers
    )
    assert first.status_code == 201
    url = first.json()["url"]
    assert re.fullmatch(r"http://localhost:8000/media/[0-9a-f]{32}\.png", url)
    filename = url.rsplit("/", 1)[1]
    with open(os.path.join("media", filename), "rb") as stored:
        assert stored.read() == PNG_1PX

    second = seeded.post(
        "/api/admin/images", files={"file": ("pixel.png", PNG_1PX, "image/png")}, headers=headers
    )
    assert second.json()["url"] != url

    served = seeded.get(f"/media/{filename}")
    assert served.status_code == 200
    assert served.content == PNG_1PX
    os.unlink(os.path.join("media", filename))
    os.unlink(os.path.join("media", second.json()["url"].rsplit("/", 1)[1]))


def test_upload_rejects_non_images_and_oversized_files(seeded):
    headers = admin_headers(seeded)
    bad_type = seeded.post(
        "/api/admin/images", files={"file": ("note.txt", b"hello", "text/plain")}, headers=headers
    )
    assert bad_type.status_code == 422
    oversized = seeded.post(
        "/api/admin/images",
        files={"file": ("big.png", b"0" * (5 * 1024 * 1024 + 1), "image/png")},
        headers=headers,
    )
    assert oversized.status_code == 422


def test_ensure_admin_bootstraps_and_is_idempotent(monkeypatch):
    monkeypatch.setattr(settings, "admin_email", "boss@example.com")
    monkeypatch.setattr(settings, "admin_password", "secret-admin-1")

    async def bootstrap_twice():
        async with _isolated_db() as factory:
            first = await ensure_admin(factory)
            second = await ensure_admin(factory)
            return first, second

    first, second = asyncio.run(bootstrap_twice())
    assert first.id == second.id
    assert first.email == "boss@example.com"
    assert first.role == "admin"

    monkeypatch.setattr(settings, "admin_email", "")
    monkeypatch.setattr(settings, "admin_password", "")
    assert asyncio.run(_run_ensure_admin()) is None


def test_bootstrapped_admin_can_log_in(seeded, monkeypatch):
    monkeypatch.setattr(settings, "admin_email", "boss@example.com")
    monkeypatch.setattr(settings, "admin_password", "secret-admin-1")
    asyncio.run(_run_ensure_admin())

    response = seeded.post(
        "/api/auth/login",
        json={"email": "BOSS@example.com", "password": "secret-admin-1"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"
    assert response.json()["user"]["name"] == "Administrator"


async def _run_ensure_admin():
    async with _isolated_db() as factory:
        return await ensure_admin(factory)


# --- Orders & quotes (#16) ---


def test_admin_orders_are_listed_with_status_and_items(seeded):
    order = make_order(seeded)
    headers = admin_headers(seeded)
    listed = seeded.get("/api/admin/orders", headers=headers)
    assert listed.status_code == 200
    rows = listed.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["order_number"] == order["order_number"]
    assert row["status"] == "awaiting_payment"
    assert row["payment_method"] == "western_union"
    assert row["payment_status"] == "pending"
    assert row["email"] == "customer@example.com"
    assert row["phone"] == "+595 981 123 456"
    assert row["name"] == "Juan Pérez"
    assert row["address"] == "Av. Mariscal López 1234"
    assert row["city"] == "Asunción"
    assert len(row["items"]) == 1
    assert row["items"][0]["product_name"] == "High Performance Digital Imaging System VK-2s"
    assert row["items"][0]["quantity"] == 1
    assert row["subtotal_gs"] == 1000000

    assert seeded.get("/api/admin/orders").status_code == 401
    customer = register(seeded, email="other@example.com")
    assert (
        seeded.get("/api/admin/orders", headers=auth_headers(customer["token"])).status_code
        == 403
    )


def test_admin_order_status_can_be_updated(seeded):
    order = make_order(seeded)
    headers = admin_headers(seeded)
    for status in ("shipped", "delivered"):
        updated = seeded.patch(
            f"/api/admin/orders/{order['order_number']}", json={"status": status}, headers=headers
        )
        # The admin surface keys on the row id, like the rest of /api/admin;
        # a non-numeric path is a validation error, not an order lookup.
        assert updated.status_code == 422

    order_id = next(
        row["id"]
        for row in seeded.get("/api/admin/orders", headers=headers).json()
        if row["order_number"] == order["order_number"]
    )
    shipped = seeded.patch(f"/api/admin/orders/{order_id}", json={"status": "shipped"}, headers=headers)
    assert shipped.status_code == 200
    assert shipped.json()["status"] == "shipped"

    delivered = seeded.patch(
        f"/api/admin/orders/{order_id}", json={"status": "delivered"}, headers=headers
    )
    assert delivered.json()["status"] == "delivered"

    # The storefront lookup reflects the fulfilment status.
    tracked = seeded.get(
        f"/api/orders/{order['order_number']}?email=customer@example.com"
    ).json()
    assert tracked["status"] == "delivered"


def test_admin_order_rejects_unknown_status_and_id(seeded):
    make_order(seeded)
    headers = admin_headers(seeded)
    order_id = seeded.get("/api/admin/orders", headers=headers).json()[0]["id"]
    assert (
        seeded.patch(
            f"/api/admin/orders/{order_id}", json={"status": "refunded"}, headers=headers
        ).status_code
        == 422
    )
    assert (
        seeded.patch(f"/api/admin/orders/999", json={"status": "paid"}, headers=headers).status_code
        == 404
    )


def test_admin_marking_order_paid_confirms_western_union_payment(seeded):
    order = make_order(seeded)
    headers = admin_headers(seeded)
    order_id = seeded.get("/api/admin/orders", headers=headers).json()[0]["id"]
    paid = seeded.patch(f"/api/admin/orders/{order_id}", json={"status": "paid"}, headers=headers)
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"
    assert paid.json()["payment_status"] == "paid"

    # The customer's order page now shows the paid order (no gateway involved).
    tracked = seeded.get(
        f"/api/orders/{order['order_number']}?email=customer@example.com"
    ).json()
    assert tracked["status"] == "paid"


def test_admin_marking_gateway_order_paid_does_not_confirm_its_payment(seeded):
    # Gateway-backed payments are confirmed only by POST /api/payments/confirm;
    # an admin setting the order paid is the manual path for Western Union
    # alone (docs/adr/0001-payments.md).
    cart_id = new_cart(seeded)
    seeded.post(
        "/api/cart/items",
        json={"product_slug": "high-performance-digital-imaging-system-vk-2s"},
        headers=cookie_header(cart_id),
    )
    checkout = seeded.post(
        "/api/orders",
        json={
            "email": "customer@example.com",
            "phone": "+595 981 123 456",
            "delivery_type": "local",
            "payment_method": "paypal",
            "name": "Juan Pérez",
            "address": "Av. Mariscal López 1234",
            "city": "Asunción",
            "country": "Paraguay",
        },
        headers=cookie_header(cart_id),
    )
    assert checkout.status_code == 201
    headers = admin_headers(seeded)
    order_id = seeded.get("/api/admin/orders", headers=headers).json()[0]["id"]
    paid = seeded.patch(f"/api/admin/orders/{order_id}", json={"status": "paid"}, headers=headers)
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"
    assert paid.json()["payment_status"] == "pending"


def test_admin_quotes_are_listed_with_customer_details(seeded):
    quote = make_quote(seeded)
    headers = admin_headers(seeded)
    listed = seeded.get("/api/admin/quotes", headers=headers)
    assert listed.status_code == 200
    rows = listed.json()
    assert len(rows) == 1
    row = rows[0]
    assert row["reference"] == quote["reference"]
    assert row["kind"] == "used"
    assert row["status"] == "new"
    assert row["name"] == "María González"
    assert row["email"] == "maria@example.com"
    assert row["phone"] == "+595 981 654 321"
    assert row["message"] == "¿Tienen un tonómetro usado?"
    assert row["product_name"] is None

    assert seeded.get("/api/admin/quotes").status_code == 401
    customer = register(seeded, email="other@example.com")
    assert (
        seeded.get("/api/admin/quotes", headers=auth_headers(customer["token"])).status_code == 403
    )


def test_admin_quote_status_can_be_updated(seeded):
    quote = make_quote(seeded)
    headers = admin_headers(seeded)
    quote_id = seeded.get("/api/admin/quotes", headers=headers).json()[0]["id"]
    assert quote_id != quote["reference"]

    responded = seeded.patch(
        f"/api/admin/quotes/{quote_id}", json={"status": "responded"}, headers=headers
    )
    assert responded.status_code == 200
    assert responded.json()["status"] == "responded"

    closed = seeded.patch(f"/api/admin/quotes/{quote_id}", json={"status": "closed"}, headers=headers)
    assert closed.json()["status"] == "closed"

    # The customer's lookup page reflects the response.
    tracked = seeded.get(f"/api/quotes/{quote['reference']}?email=maria@example.com").json()
    assert tracked["status"] == "closed"


def test_admin_quote_rejects_unknown_status_and_id(seeded):
    make_quote(seeded)
    headers = admin_headers(seeded)
    quote_id = seeded.get("/api/admin/quotes", headers=headers).json()[0]["id"]
    assert (
        seeded.patch(
            f"/api/admin/quotes/{quote_id}", json={"status": "archived"}, headers=headers
        ).status_code
        == 422
    )
    assert (
        seeded.patch(f"/api/admin/quotes/999", json={"status": "closed"}, headers=headers).status_code
        == 404
    )
