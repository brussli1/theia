import psycopg2

from tests.conftest import _connect


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
    assert body["description_html"] == (
        "<p>Captures <strong>ultra-widefield</strong> images for retina clinics.</p>"
    )
    assert body["image_alt"] == ["Fundus camera VK-2s", "Fundus camera rear view"]
    assert body["specifications"] == [
        {"key": "Magnification", "value": "10x-16x"},
        {"key": "Camera", "value": "CCD"},
    ]
    assert body["certifications"] == ["CE"]
    assert body["available"] is True
    assert body["orderable"] is True
    assert body["brand"] == "Kowa"
    assert body["category"] == "ANALYTICAL INSTRUMENTS"
    # Cross-links resolve to existing targets with their names.
    assert body["cross_links"] == {
        "related_categories": [{"slug": "auto-refractores", "name": "Auto-refractores"}],
        "related_products": [
            {"slug": "hhou-7040-refraction-units", "name": "HHOU 7040 Refraction Units"},
            {"slug": "auto-refractor-huvitz-hrk-1", "name": "Auto-refractor Huvitz HRK-1"},
        ],
        "related_articles": [],
    }


def test_product_detail_unknown_slug_returns_404(seeded):
    response = seeded.get("/api/products/does-not-exist")
    assert response.status_code == 404


def test_product_detail_quote_only_product(seeded):
    body = seeded.get("/api/products/hhou-7040-refraction-units").json()
    assert body["orderable"] is False
    assert body["available"] is True
    # Products without cross-links return empty lists.
    assert body["cross_links"] == {
        "related_categories": [],
        "related_products": [],
        "related_articles": [],
    }


def test_product_detail_cross_links_drop_missing_targets(seeded):
    # VK-2s carries a product link whose slug no longer exists in the catalog;
    # the API must drop it and keep only resolvable targets.
    with _connect() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM products WHERE slug = 'auto-refractor-huvitz-hrk-1'")
        conn.commit()
    body = seeded.get("/api/products/high-performance-digital-imaging-system-vk-2s").json()
    related_products = [p["slug"] for p in body["cross_links"]["related_products"]]
    assert "auto-refractor-huvitz-hrk-1" not in related_products
    assert related_products == ["hhou-7040-refraction-units"]
