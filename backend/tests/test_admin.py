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
from helpers import admin_headers, auth_headers, register

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


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
