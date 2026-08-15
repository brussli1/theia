import re

from fastapi.testclient import TestClient

QUOTE_ONLY_SLUG = "hhou-7040-refraction-units"
ORDERABLE_SLUG = "high-performance-digital-imaging-system-vk-2s"

QUOTE_PAYLOAD = {
    "kind": "product",
    "name": "Juan Pérez",
    "email": "customer@example.com",
    "phone": "+595 981 123 456",
    "message": "¿Cuál es el precio con instalación?",
}


def submit_quote(client: TestClient, **overrides):
    payload = {**QUOTE_PAYLOAD, "product_slug": QUOTE_ONLY_SLUG, **overrides}
    return client.post("/api/quotes", json=payload)


def test_product_quote_is_stored_and_lookup_by_reference(seeded):
    response = submit_quote(seeded)
    assert response.status_code == 201
    body = response.json()
    assert re.fullmatch(r"QT-[A-Z2-9]{8}", body["reference"])
    assert body["kind"] == "product"
    assert body["product_name"] == "HHOU 7040 Refraction Units"
    assert body["name"] == "Juan Pérez"
    assert body["email"] == "customer@example.com"
    assert body["phone"] == "+595 981 123 456"
    assert body["message"] == "¿Cuál es el precio con instalación?"
    assert body["status"] == "new"

    lookup = seeded.get(
        f"/api/quotes/{body['reference']}", params={"email": QUOTE_PAYLOAD["email"]}
    )
    assert lookup.status_code == 200
    assert lookup.json() == body


def test_used_and_rental_quotes_are_stored_without_product(seeded):
    for kind in ("used", "rental"):
        response = submit_quote(seeded, kind=kind, product_slug=None)
        assert response.status_code == 201
        body = response.json()
        assert body["kind"] == kind
        assert body["product_name"] is None

    quote = submit_quote(seeded, kind="used", product_slug=None).json()
    lookup = seeded.get(f"/api/quotes/{quote['reference']}", params={"email": QUOTE_PAYLOAD["email"]})
    assert lookup.status_code == 200
    assert lookup.json()["kind"] == "used"


def test_product_quote_without_slug_is_rejected(seeded):
    response = submit_quote(seeded, product_slug=None)
    assert response.status_code == 422


def test_product_quote_with_unknown_slug_is_rejected(seeded):
    response = submit_quote(seeded, product_slug="no-such-product")
    assert response.status_code == 404


def test_product_quote_for_orderable_product_is_rejected(seeded):
    response = submit_quote(seeded, product_slug=ORDERABLE_SLUG)
    assert response.status_code == 400


def test_quote_validates_payload(seeded):
    assert submit_quote(seeded, kind="courier").status_code == 422
    assert submit_quote(seeded, email="not-an-email").status_code == 422
    assert submit_quote(seeded, name="").status_code == 422
    assert submit_quote(seeded, phone="").status_code == 422


def test_quote_lookup_requires_email_and_guards_it(seeded):
    quote = submit_quote(seeded).json()
    assert seeded.get(f"/api/quotes/{quote['reference']}").status_code == 422

    wrong_email = seeded.get(
        f"/api/quotes/{quote['reference']}", params={"email": "other@example.com"}
    )
    assert wrong_email.status_code == 404

    unknown = seeded.get(
        "/api/quotes/QT-AAAAAAAA", params={"email": QUOTE_PAYLOAD["email"]}
    )
    assert unknown.status_code == 404


def test_quote_lookup_is_case_insensitive(seeded):
    quote = submit_quote(seeded).json()
    response = seeded.get(
        f"/api/quotes/{quote['reference'].lower()}",
        params={"email": QUOTE_PAYLOAD["email"].upper()},
    )
    assert response.status_code == 200
