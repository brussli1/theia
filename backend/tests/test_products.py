def names(payload) -> list[str]:
    return [item["name"] for item in payload["items"]]


def test_returns_paginated_products(seeded):
    response = seeded.get("/api/products")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 4
    assert body["page"] == 1
    assert body["page_size"] == 12
    assert body["pages"] == 1
    assert len(body["items"]) == 4


def test_pagination_respects_page_size(seeded):
    body = seeded.get("/api/products", params={"page_size": 2, "sort": "price_asc"}).json()
    assert len(body["items"]) == 2
    assert body["total"] == 4
    assert body["pages"] == 2
    second = seeded.get(
        "/api/products", params={"page_size": 2, "page": 2, "sort": "price_asc"}
    ).json()
    assert len(second["items"]) == 2
    assert names(second) != names(body)


def test_card_shape(seeded):
    item = seeded.get("/api/products", params={"sort": "price_asc"}).json()["items"][0]
    assert item["name"] == "Auto-refractor Huvitz HRK-1"
    assert item["price_gs"] == 6850
    assert item["price_usd"] == "0.98"
    assert item["image"] is None
    assert item["available"] is False
    assert item["orderable"] is True
    assert item["certifications"] == ["FDA"]
    assert item["brand"] == "Huvitz"
    assert item["category"] == "Auto-refractores"


def test_quote_only_product_reported_as_not_orderable(seeded):
    item = next(
        i
        for i in seeded.get("/api/products").json()["items"]
        if i["slug"] == "hhou-7040-refraction-units"
    )
    assert item["orderable"] is False
    assert item["available"] is True


def test_search_matches_name_and_description(seeded):
    by_name = seeded.get("/api/products", params={"q": "fundus"}).json()
    assert set(names(by_name)) == {
        "High Performance Digital Imaging System VK-2s",
        "Kowa VK-90 Fundus Camera",
    }
    by_description = seeded.get("/api/products", params={"q": "keratometer"}).json()
    assert names(by_description) == ["Auto-refractor Huvitz HRK-1"]
    none = seeded.get("/api/products", params={"q": "tomografia"}).json()
    assert none["total"] == 0


def test_filter_by_category(seeded):
    body = seeded.get("/api/products", params={"category": "auto-refractores"}).json()
    assert names(body) == ["Auto-refractor Huvitz HRK-1"]


def test_filter_by_brand(seeded):
    body = seeded.get("/api/products", params={"brand": "kowa"}).json()
    assert set(names(body)) == {
        "High Performance Digital Imaging System VK-2s",
        "Kowa VK-90 Fundus Camera",
    }


def test_filter_by_certification(seeded):
    body = seeded.get("/api/products", params={"certification": "ce"}).json()
    assert names(body) == ["High Performance Digital Imaging System VK-2s"]
    invalid = seeded.get("/api/products", params={"certification": "garbage"})
    assert invalid.status_code == 422


def test_search_escapes_like_wildcards(seeded):
    body = seeded.get("/api/products", params={"q": "100%"}).json()
    assert body["total"] == 0
    underscored = seeded.get("/api/products", params={"q": "fundus_camera"}).json()
    assert underscored["total"] == 0


def test_filter_by_price_range(seeded):
    body = seeded.get("/api/products", params={"price_min": 1000000, "price_max": 60000000}).json()
    assert set(names(body)) == {
        "High Performance Digital Imaging System VK-2s",
        "Kowa VK-90 Fundus Camera",
    }


def test_sort_by_price_and_newest(seeded):
    ascending = seeded.get("/api/products", params={"sort": "price_asc"}).json()["items"]
    assert [item["price_gs"] for item in ascending] == sorted(i["price_gs"] for i in ascending)
    descending = seeded.get("/api/products", params={"sort": "price_desc"}).json()["items"]
    assert [item["price_gs"] for item in descending] == sorted(
        (i["price_gs"] for i in descending), reverse=True
    )
    newest = seeded.get("/api/products", params={"sort": "newest"}).json()["items"]
    assert newest[0]["name"] == "Kowa VK-90 Fundus Camera"


def test_combined_filters_and_search(seeded):
    body = seeded.get(
        "/api/products",
        params={"q": "fundus", "brand": "kowa", "certification": "ce"},
    ).json()
    assert names(body) == ["High Performance Digital Imaging System VK-2s"]
