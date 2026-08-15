def test_product_detail_returns_full_payload(seeded):
    response = seeded.get("/api/products/high-performance-digital-imaging-system-vk-2s")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "High Performance Digital Imaging System VK-2s"
    assert body["price_gs"] == 1000000
    assert body["price_usd"] == "142.86"
    assert body["images"] == [
        "https://placehold.co/750x400?text=VK-2s+1",
        "https://placehold.co/750x400?text=VK-2s+2",
    ]
    assert body["specifications"] == [
        {"key": "Magnification", "value": "10x-16x"},
        {"key": "Camera", "value": "CCD"},
    ]
    assert body["certifications"] == ["CE"]
    assert body["available"] is True
    assert body["orderable"] is True
    assert body["brand"] == "Kowa"
    assert body["category"] == "ANALYTICAL INSTRUMENTS"


def test_product_detail_unknown_slug_returns_404(seeded):
    response = seeded.get("/api/products/does-not-exist")
    assert response.status_code == 404


def test_product_detail_quote_only_product(seeded):
    body = seeded.get("/api/products/hhou-7040-refraction-units").json()
    assert body["orderable"] is False
    assert body["available"] is True
