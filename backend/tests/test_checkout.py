import os
import re

import psycopg2
from fastapi.testclient import TestClient
from helpers import cookie_header, new_cart

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


def test_checkout_converts_cart_into_order(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    add_orderable(seeded, cart_id)

    response = seeded.post(
        "/api/orders", json=CHECKOUT_PAYLOAD, headers=cookie_header(cart_id)
    )
    assert response.status_code == 201
    body = response.json()
    assert re.fullmatch(r"TH-[A-Z2-9]{8}", body["order_number"])
    assert body["status"] == "awaiting_payment"
    assert body["email"] == "customer@example.com"
    assert body["phone"] == "+595 981 123 456"
    assert body["delivery_type"] == "local"
    assert body["name"] == "Juan Pérez"
    assert body["address"] == "Av. Mariscal López 1234"
    assert body["city"] == "Asunción"
    assert body["country"] == "Paraguay"
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert item["product_name"] == "High Performance Digital Imaging System VK-2s"
    assert item["quantity"] == 2
    assert item["price_gs"] == 1000000
    assert item["price_usd"] == "142.86"
    assert body["subtotal_gs"] == 2000000
    assert body["subtotal_usd"] == "285.72"

    cart = seeded.get("/api/cart", headers=cookie_header(cart_id)).json()
    assert cart["items"] == []
    assert cart["total_items"] == 0


def checkout(client: TestClient, cart_id: str | None = None, **overrides):
    headers = cookie_header(cart_id) if cart_id else {}
    payload = {**CHECKOUT_PAYLOAD, **overrides}
    return client.post("/api/orders", json=payload, headers=headers)


def test_checkout_totals_multiple_items_and_currencies(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    seeded.post(
        "/api/cart/items",
        json={"product_slug": "kowa-vk-90-fundus-camera", "quantity": 3},
        headers=cookie_header(cart_id),
    )

    response = checkout(seeded, cart_id)
    assert response.status_code == 201
    body = response.json()
    assert len(body["items"]) == 2
    assert body["subtotal_gs"] == 1000000 + 3 * 50000000
    assert body["subtotal_usd"] == "21571.44"  # 142.86 + 3 * 7142.86


def test_checkout_international_delivery_is_stored(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    payload = {
        **CHECKOUT_PAYLOAD,
        "delivery_type": "international",
        "country": "Brazil",
        "postal_code": "01310-100",
        "notes": "Call on arrival",
    }
    response = seeded.post(
        "/api/orders", json=payload, headers=cookie_header(cart_id)
    )
    assert response.status_code == 201
    body = response.json()
    assert body["delivery_type"] == "international"
    assert body["country"] == "Brazil"
    assert body["postal_code"] == "01310-100"
    assert body["notes"] == "Call on arrival"


def test_checkout_rejects_empty_cart_and_missing_cart(seeded):
    assert checkout(seeded).status_code == 400
    cart_id = new_cart(seeded)
    assert checkout(seeded, cart_id).status_code == 400


def test_checkout_consumes_the_cart(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    assert checkout(seeded, cart_id).status_code == 201
    assert checkout(seeded, cart_id).status_code == 400


def test_checkout_validates_payload(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)

    assert checkout(seeded, cart_id, email="not-an-email").status_code == 422
    assert checkout(seeded, cart_id, delivery_type="courier").status_code == 422
    assert checkout(seeded, cart_id, name="").status_code == 422
    assert checkout(seeded, cart_id, phone="").status_code == 422


def test_order_lookup_by_number_and_email(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    order = checkout(seeded, cart_id).json()

    response = seeded.get(
        f"/api/orders/{order['order_number']}", params={"email": CHECKOUT_PAYLOAD["email"]}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["order_number"] == order["order_number"]
    assert body["status"] == "awaiting_payment"
    assert body["items"][0]["product_name"] == "High Performance Digital Imaging System VK-2s"
    assert body["subtotal_gs"] == 1000000


def test_order_lookup_is_case_insensitive(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    order = checkout(seeded, cart_id).json()

    response = seeded.get(
        f"/api/orders/{order['order_number'].lower()}",
        params={"email": CHECKOUT_PAYLOAD["email"].upper()},
    )
    assert response.status_code == 200


def test_order_lookup_requires_email(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    order = checkout(seeded, cart_id).json()
    assert seeded.get(f"/api/orders/{order['order_number']}").status_code == 422


def test_order_lookup_404_for_unknown_or_mismatched(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    order = checkout(seeded, cart_id).json()

    wrong_email = seeded.get(
        f"/api/orders/{order['order_number']}", params={"email": "other@example.com"}
    )
    assert wrong_email.status_code == 404
    unknown = seeded.get("/api/orders/TH-AAAAAAAA", params={"email": CHECKOUT_PAYLOAD["email"]})
    assert unknown.status_code == 404


def test_checkout_rejects_unavailable_product(seeded):
    cart_id = new_cart(seeded)
    seeded.post(
        "/api/cart/items",
        json={"product_slug": "auto-refractor-huvitz-hrk-1"},  # available = False
        headers=cookie_header(cart_id),
    )
    response = checkout(seeded, cart_id)
    assert response.status_code == 409
    assert seeded.get("/api/cart", headers=cookie_header(cart_id)).json()["total_items"] == 1


def _set_product_flag(slug: str, column: str, value: bool) -> None:
    with psycopg2.connect(os.environ["DATABASE_URL_SYNC"]) as conn:
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute(
                f"UPDATE products SET {column} = %s WHERE slug = %s", (value, slug)
            )


def test_checkout_rejects_product_that_became_quote_only(seeded):
    cart_id = new_cart(seeded)
    add_orderable(seeded, cart_id)
    _set_product_flag(ORDERABLE_SLUG, "orderable", False)

    response = checkout(seeded, cart_id)
    assert response.status_code == 409
    # The cart survives; the customer can still review or drop the product.
    assert seeded.get("/api/cart", headers=cookie_header(cart_id)).json()["total_items"] == 1
