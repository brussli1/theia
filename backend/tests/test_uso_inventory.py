import json
from pathlib import Path

import pytest

from scripts import uso_inventory_lib as lib

FIXTURES = Path(__file__).parent / "fixtures"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def test_parse_products_page_normalizes_shopify_shape():
    raw = load_fixture("uso_products_page.json")
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
    raw = load_fixture("uso_collections_page.json")
    collections = lib.parse_collections_page(raw)
    assert [c.title for c in collections] == ["Autorefractors", "Chairs"]
    assert collections[0].products_count == 4
    assert collections[0].handle == "autorefractors"


def test_build_report_counts_vendors_gaps_and_quote_only():
    products = lib.parse_products_page(load_fixture("uso_products_page.json"))
    report = lib.build_report(products)

    assert report.product_count == 2
    assert report.vendor_count == 2
    assert [(v.vendor, v.count) for v in report.vendors] == [("Ezer", 1), ("Neitz", 1)]
    assert report.image_gap_count == 1
    assert [(g.handle, g.title) for g in report.image_gaps] == [
        ("bls-2-2-0x-2-5x", "Neitz NTZ-BLS-2 (2.0X - 2.5X)")
    ]
    assert report.quote_only_count == 1
    assert [(g.handle, g.title) for g in report.quote_only] == [
        ("ezer-panorama-ultra-widefield-retinal-camera-1",
         "Ezer Panorama Ultra-Widefield Retinal Camera")
    ]
    assert report.unpriced_count == 0
    assert report.total_images == 1


def test_missing_price_is_unpriced_not_quote_only():
    raw = load_fixture("uso_products_page.json")
    raw["products"][0]["variants"][0]["price"] = None
    report = lib.build_report(lib.parse_products_page(raw))
    assert report.quote_only_count == 0
    assert report.unpriced_count == 1


def test_variantless_product_is_unpriced():
    raw = load_fixture("uso_products_page.json")
    raw["products"][0]["variants"] = []
    report = lib.build_report(lib.parse_products_page(raw))
    assert report.quote_only_count == 0
    assert report.unpriced_count == 1


def test_fetch_items_paginates_until_empty():
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


def test_fetch_items_fails_loudly_on_empty_first_page():
    with pytest.raises(RuntimeError, match="empty"):
        lib.fetch_items(
            lambda url: {"products": []}, "/products.json", item_key="products"
        )


def test_fetch_items_fails_when_pagination_never_terminates():
    with pytest.raises(RuntimeError, match="did not terminate"):
        lib.fetch_items(
            lambda url: {"products": ["x"]}, "/products.json", item_key="products"
        )
