import json
from pathlib import Path

from scripts import uso_inventory_lib as lib

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_products_page_normalizes_shopify_shape():
    raw = json.loads((FIXTURES / "uso_products_page.json").read_text())
    products = lib.parse_products_page(raw)
    assert len(products) == 2

    first = products[0]
    assert first.title == "Ezer Panorama Ultra-Widefield Retinal Camera"
    assert first.handle == "ezer-panorama-ultra-widefield-retinal-camera-1"
    assert first.vendor == "Ezer"
    assert first.product_type == "Retinal Camera"
    assert first.tags == ["imaging", "Ezer"]
    assert first.body_html.startswith("<p>")
    assert first.images == [
        "https://cdn.shopify.com/s/files/1/0482/5209/2577/files/panorama.jpg"
    ]
    assert first.variants[0].title == "Default Title"
    assert first.variants[0].price == 0.0

    second = products[1]
    assert second.images == []
    assert second.variants[0].price == 1299.0


def test_parse_collections_page():
    raw = json.loads((FIXTURES / "uso_collections_page.json").read_text())
    collections = lib.parse_collections_page(raw)
    assert [c.title for c in collections] == ["Autorefractors", "Chairs"]
    assert collections[0].products_count == 4
    assert collections[0].handle == "autorefractors"


def test_build_report_counts_vendors_gaps_and_quote_only():
    raw = json.loads((FIXTURES / "uso_products_page.json").read_text())
    products = lib.parse_products_page(raw)
    report = lib.build_report(products)

    assert report["product_count"] == 2
    assert report["vendor_count"] == 2
    assert report["vendors"] == [
        {"vendor": "Ezer", "count": 1},
        {"vendor": "Neitz", "count": 1},
    ]
    assert report["image_gap_count"] == 1
    assert report["image_gaps"] == [
        {"handle": "bls-2-2-0x-2-5x", "title": "Neitz NTZ-BLS-2 (2.0X - 2.5X)"}
    ]
    assert report["quote_only_count"] == 1
    assert report["total_images"] == 1


def test_fetch_items_paginates_until_empty_and_fails_loudly_on_first_page():
    pages = {
        "/products.json?limit=2&page=1": {"products": ["a", "b"]},
        "/products.json?limit=2&page=2": {"products": ["c"]},
        "/products.json?limit=2&page=3": {"products": []},
    }
    calls = []

    def get_json(url):
        calls.append(url)
        return pages[url]

    items = lib.fetch_items(get_json, "/products.json", item_key="products", limit=2)
    assert items == ["a", "b", "c"]
    assert calls == [
        "/products.json?limit=2&page=1",
        "/products.json?limit=2&page=2",
        "/products.json?limit=2&page=3",
    ]

    def empty_first_page(url):
        return {"products": []}

    try:
        lib.fetch_items(empty_first_page, "/products.json", item_key="products", limit=2)
        assert False, "expected RuntimeError"
    except RuntimeError as exc:
        assert "empty" in str(exc)
