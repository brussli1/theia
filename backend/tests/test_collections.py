def collection_map(payload) -> dict[str, list[str]]:
    return {
        item["type"]: [product["name"] for product in item["products"]]
        for item in payload
    }


def test_returns_curated_collections_in_position_order(seeded):
    body = seeded.get("/api/collections").json()
    assert sorted(item["type"] for item in body) == ["carousel", "popular", "promo"]

    collections = collection_map(body)
    assert collections["carousel"] == [
        "High Performance Digital Imaging System VK-2s",
        "HHOU 7040 Refraction Units",
    ]
    assert collections["popular"] == [
        "High Performance Digital Imaging System VK-2s",
        "Kowa VK-90 Fundus Camera",
    ]
    assert collections["promo"] == ["HHOU 7040 Refraction Units"]


def test_collection_products_carry_card_shape(seeded):
    body = seeded.get("/api/collections").json()
    product = next(
        product
        for collection in body
        if collection["type"] == "popular"
        for product in collection["products"]
        if product["slug"] == "high-performance-digital-imaging-system-vk-2s"
    )
    assert product["price_gs"] == 1000000
    assert product["price_usd"] == "142.86"
    assert product["orderable"] is True
    assert product["brand"] == "Kowa"


def test_collections_empty_when_unseeded(client):
    assert client.get("/api/collections").json() == []
