"""Account history (#14): a signed-in customer's orders and quote requests.

Orders and quote requests are attached to the account when they are created
while signed in (checkout / quote submit); guest-created records never appear
in an account's history, and one account never sees another's.
"""

from helpers import REGISTER_PAYLOAD, auth_headers, cookie_header, new_cart, register

ORDERABLE_SLUG = "high-performance-digital-imaging-system-vk-2s"
QUOTE_ONLY_SLUG = "hhou-7040-refraction-units"

CHECKOUT_PAYLOAD = {
    "email": "customer@example.com",
    "phone": "+595 981 123 456",
    "delivery_type": "local",
    "payment_method": "western_union",
    "name": "Juan Pérez",
    "address": "Av. Mariscal López 1234",
    "city": "Asunción",
    "country": "Paraguay",
}

QUOTE_PAYLOAD = {
    "kind": "product",
    "name": "Juan Pérez",
    "email": "customer@example.com",
    "phone": "+595 981 123 456",
    "product_slug": QUOTE_ONLY_SLUG,
}


def authenticated_checkout(client, token: str) -> dict:
    cart_id = new_cart(client)
    client.post(
        "/api/cart/items",
        json={"product_slug": ORDERABLE_SLUG},
        headers=cookie_header(cart_id),
    )
    headers = {**cookie_header(cart_id), **auth_headers(token)}
    response = client.post("/api/orders", json=CHECKOUT_PAYLOAD, headers=headers)
    assert response.status_code == 201
    return response.json()


def guest_checkout(client) -> dict:
    cart_id = new_cart(client)
    client.post(
        "/api/cart/items",
        json={"product_slug": ORDERABLE_SLUG},
        headers=cookie_header(cart_id),
    )
    response = client.post("/api/orders", json=CHECKOUT_PAYLOAD, headers=cookie_header(cart_id))
    assert response.status_code == 201
    return response.json()


def test_account_endpoints_require_a_valid_token(seeded):
    assert seeded.get("/api/account/orders").status_code == 401
    assert seeded.get("/api/account/quotes").status_code == 401
    assert (
        seeded.get("/api/account/orders", headers=auth_headers("garbage")).status_code
        == 401
    )


def test_account_history_starts_empty(seeded):
    token = register(seeded)["token"]
    assert seeded.get("/api/account/orders", headers=auth_headers(token)).json() == []
    assert seeded.get("/api/account/quotes", headers=auth_headers(token)).json() == []


def test_signed_in_checkout_lands_in_order_history(seeded):
    token = register(seeded)["token"]
    order = authenticated_checkout(seeded, token)

    history = seeded.get("/api/account/orders", headers=auth_headers(token))
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["order_number"] == order["order_number"]
    assert history.json()[0]["status"] == "awaiting_payment"
    assert history.json()[0]["items"][0]["product_name"] == (
        "High Performance Digital Imaging System VK-2s"
    )


def test_signed_in_quote_lands_in_quote_history(seeded):
    token = register(seeded)["token"]
    response = seeded.post(
        "/api/quotes", json=QUOTE_PAYLOAD, headers=auth_headers(token)
    )
    assert response.status_code == 201
    reference = response.json()["reference"]

    history = seeded.get("/api/account/quotes", headers=auth_headers(token))
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["reference"] == reference
    assert history.json()[0]["kind"] == "product"


def test_account_history_excludes_guest_and_other_accounts(seeded):
    token = register(seeded)["token"]
    other_token = register(seeded, email="other@example.com")["token"]

    mine = authenticated_checkout(seeded, token)
    guest_checkout(seeded)
    authenticated_checkout(seeded, other_token)

    orders = seeded.get("/api/account/orders", headers=auth_headers(token)).json()
    assert len(orders) == 1
    assert orders[0]["order_number"] == mine["order_number"]
    # The guest and the other account's orders did not leak in.
    other_orders = seeded.get(
        "/api/account/orders", headers=auth_headers(other_token)
    ).json()
    assert len(other_orders) == 1
    assert other_orders[0]["order_number"] != mine["order_number"]


def test_account_quote_history_excludes_guest_and_other_accounts(seeded):
    token = register(seeded)["token"]
    other_token = register(seeded, email="other@example.com")["token"]

    mine = seeded.post("/api/quotes", json=QUOTE_PAYLOAD, headers=auth_headers(token))
    seeded.post("/api/quotes", json={**QUOTE_PAYLOAD, "kind": "used"})
    other = seeded.post(
        "/api/quotes",
        json={**QUOTE_PAYLOAD, "kind": "rental"},
        headers=auth_headers(other_token),
    )

    quotes = seeded.get("/api/account/quotes", headers=auth_headers(token)).json()
    assert len(quotes) == 1
    assert quotes[0]["reference"] == mine.json()["reference"]
    other_quotes = seeded.get(
        "/api/account/quotes", headers=auth_headers(other_token)
    ).json()
    assert len(other_quotes) == 1
    assert other_quotes[0]["reference"] == other.json()["reference"]


def test_account_history_is_newest_first(seeded):
    token = register(seeded)["token"]
    first = authenticated_checkout(seeded, token)
    second = authenticated_checkout(seeded, token)

    history = seeded.get("/api/account/orders", headers=auth_headers(token)).json()
    assert [entry["order_number"] for entry in history] == [
        second["order_number"],
        first["order_number"],
    ]
