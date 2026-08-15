import re

from fastapi.testclient import TestClient
from helpers import cookie_header, new_cart

from app.payments.base import PaymentProviderError

ORDERABLE_SLUG = "high-performance-digital-imaging-system-vk-2s"

CHECKOUT_PAYLOAD = {
    "email": "customer@example.com",
    "phone": "+595 981 123 456",
    "delivery_type": "local",
    "payment_method": "western_union",
    "name": "Juan Pérez",
    "address": "Av. Mariscal López 1234",
    "city": "Asunción",
    "region": "Central",
    "postal_code": "1000",
    "country": "Paraguay",
}


def add_orderable(client: TestClient, cart_id: str):
    return client.post(
        "/api/cart/items",
        json={"product_slug": ORDERABLE_SLUG},
        headers=cookie_header(cart_id),
    )


def checkout(client: TestClient, cart_id: str, **overrides):
    payload = {**CHECKOUT_PAYLOAD, **overrides}
    return client.post("/api/orders", json=payload, headers=cookie_header(cart_id))


def order_with_cart(client: TestClient, **overrides):
    cart_id = new_cart(client)
    add_orderable(client, cart_id)
    return cart_id, checkout(client, cart_id, **overrides)


def payment_ref_of(body: dict) -> str:
    return re.search(r"payment_ref=([^&]+)", body["payment_redirect_url"]).group(1)


def test_checkout_requires_payment_method(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    payload = {k: v for k, v in CHECKOUT_PAYLOAD.items() if k != "payment_method"}
    response = seeded.post(
        "/api/orders", json=payload, headers=cookie_header(cart_id)
    )
    assert response.status_code == 422


def test_checkout_rejects_unknown_payment_method(seeded):
    cart_id, response = order_with_cart(seeded, payment_method="cash")
    assert response.status_code == 422


def test_western_union_marks_order_awaiting_payment(seeded):
    cart_id, response = order_with_cart(seeded)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "awaiting_payment"
    assert body["payment_method"] == "western_union"
    assert body["payment_currency"] == "PYG"
    assert body["payment_redirect_url"] is None


def test_paypal_creates_payment_intent_and_confirms_paid(seeded):
    cart_id, response = order_with_cart(seeded, payment_method="paypal")
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "awaiting_payment"
    assert body["payment_method"] == "paypal"
    # PayPal REST cannot charge PYG, so the intent is in the USD snapshot.
    assert body["payment_currency"] == "USD"
    assert body["payment_redirect_url"] is not None
    assert "/pedido/" in body["payment_redirect_url"]
    payment_ref = payment_ref_of(body)

    confirmed = seeded.post(
        "/api/payments/confirm",
        json={"order_number": body["order_number"], "payment_ref": payment_ref},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "paid"

    # The order lookup reflects the new status.
    lookup = seeded.get(
        f"/api/orders/{body['order_number']}", params={"email": CHECKOUT_PAYLOAD["email"]}
    )
    assert lookup.json()["status"] == "paid"


def test_card_goes_through_the_provider_adapter(seeded):
    cart_id, response = order_with_cart(seeded, payment_method="card")
    assert response.status_code == 201
    body = response.json()
    assert body["payment_method"] == "card"
    assert body["payment_currency"] == "PYG"
    assert body["payment_redirect_url"] is not None
    payment_ref = payment_ref_of(body)

    confirmed = seeded.post(
        "/api/payments/confirm",
        json={"order_number": body["order_number"], "payment_ref": payment_ref},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "paid"


def test_confirm_is_idempotent(seeded):
    cart_id, response = order_with_cart(seeded, payment_method="paypal")
    body = response.json()
    payment_ref = payment_ref_of(body)
    payload = {"order_number": body["order_number"], "payment_ref": payment_ref}

    first = seeded.post("/api/payments/confirm", json=payload)
    second = seeded.post("/api/payments/confirm", json=payload)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["status"] == "paid"
    assert second.json()["status"] == "paid"


def test_confirm_unknown_payment_returns_404(seeded):
    cart_id, response = order_with_cart(seeded, payment_method="paypal")
    body = response.json()
    wrong_ref = seeded.post(
        "/api/payments/confirm",
        json={"order_number": body["order_number"], "payment_ref": "no-such-ref"},
    )
    assert wrong_ref.status_code == 404
    wrong_order = seeded.post(
        "/api/payments/confirm",
        json={"order_number": "TH-AAAAAAAA", "payment_ref": payment_ref_of(body)},
    )
    assert wrong_order.status_code == 404


def test_confirm_western_union_order_returns_404(seeded):
    cart_id, response = order_with_cart(seeded)
    body = response.json()
    response = seeded.post(
        "/api/payments/confirm",
        json={"order_number": body["order_number"], "payment_ref": body["order_number"]},
    )
    assert response.status_code == 404


def test_checkout_gateway_failure_leaves_cart_intact(seeded, monkeypatch):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)

    def broken_provider(method):
        raise PaymentProviderError("gateway unavailable")

    monkeypatch.setattr("app.api.orders.get_provider", broken_provider)
    response = checkout(seeded, cart_id, payment_method="card")
    assert response.status_code == 502
    # The cart survives; the customer can retry or pick another method.
    assert seeded.get("/api/cart", headers=cookie_header(cart_id)).json()["total_items"] == 1
