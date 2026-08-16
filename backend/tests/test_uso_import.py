import asyncio
import json
from pathlib import Path

from helpers import admin_headers

from scripts import uso_import_lib as lib
from scripts.uso_import import _import_catalog

TINY_MENU = [
    lib.group(
        "Exam Room Essentials",
        "exam-room-essentials",
        [lib.leaf("Autorefractors", "autorefractors")],
    ),
    lib.group("Surgical", "surgical", [lib.leaf("Biometer", "biometer")]),
    lib.group(
        "Specialized Equipment",
        "specialized-equipment",
        [lib.leaf("Biometer", "biometer")],
    ),
]


def test_build_category_plan_dedupes_handles_and_orders_parents_first():
    plan = lib.build_category_plan(TINY_MENU)
    slugs = [row.slug for row in plan.rows]
    assert len(set(slugs)) == len(slugs)

    biometer_rows = [row for row in plan.rows if row.handle == "biometer"]
    assert sorted(row.slug for row in biometer_rows) == ["biometer", "biometer-2"]
    assert plan.leaf_slugs["biometer"] == "biometer"

    autorefractor_row = next(row for row in plan.rows if row.handle == "autorefractors")
    exam_row = next(row for row in plan.rows if row.name == "Exam Room Essentials")
    assert autorefractor_row.parent_slug == exam_row.slug
    assert plan.parent_slugs["exam-room-essentials"] == exam_row.slug


def test_assign_category_prefers_leaf_then_parent_then_none():
    plan = lib.build_category_plan(TINY_MENU)
    assert (
        lib.assign_category(["something-else", "autorefractors"], plan)
        == "autorefractors"
    )
    assert (
        lib.assign_category(["exam-room-essentials"], plan) == plan.parent_slugs["exam-room-essentials"]
    )
    assert lib.assign_category(["not-in-menu"], plan) is None
    assert lib.assign_category([], plan) is None


def test_brand_from_vendor_skips_house_brand_and_blanks():
    assert lib.brand_from_vendor("Ezer") == "Ezer"
    assert lib.brand_from_vendor("  Ezer ") == "Ezer"
    assert lib.brand_from_vendor("US Ophthalmic") is None
    assert lib.brand_from_vendor("") is None


def test_html_to_text_strips_markup_and_collapses_whitespace():
    assert lib.html_to_text("<p>Hello <strong>world</strong>.</p>") == "Hello world."
    assert (
        lib.html_to_text("<ul><li>a &amp; b</li>\n<li>c</li></ul>") == "a & b c"
    )
    assert lib.html_to_text("") == ""


def test_image_destinations_build_relative_paths_and_extensions():
    destinations = lib.image_destinations(
        "efc-2600", ["https://cdn.example.com/a.JPG?v=1", "https://cdn.example.com/b"]
    )
    assert destinations == [
        ("https://cdn.example.com/a.JPG?v=1", Path("shopify/efc-2600/0.jpg")),
        ("https://cdn.example.com/b", Path("shopify/efc-2600/1.jpg")),
    ]


def test_fetch_collection_membership_maps_products_to_handles():
    pages = {
        "/collections/autorefractors/products.json?limit=250&page=1": {
            "products": [{"id": 1}, {"id": 2}]
        },
        "/collections/autorefractors/products.json?limit=250&page=2": {
            "products": []
        },
        "/collections/broken/products.json?limit=250&page=1": {
            "products": []
        },
    }

    def get_json(url):
        if url.startswith("/collections/broken/"):
            raise RuntimeError("boom")
        return pages[url]

    collections = [
        {"handle": "autorefractors"},
        {"handle": "broken"},
        {"handle": ""},
    ]
    mapping, failures, failed_handles = lib.fetch_collection_membership(
        get_json, collections, cooldown=0
    )
    assert mapping == {1: ["autorefractors"], 2: ["autorefractors"]}
    assert failures == 1
    assert failed_handles == ["broken"]


def _inventory() -> dict:
    return {
        "products": [
            {
                "id": 1,
                "title": "Ezer EFC-2600",
                "handle": "efc-2600",
                "vendor": "Ezer",
                "body_html": "<p>Retinal <b>camera</b>.</p>",
                "images": ["https://cdn.example.com/a.jpg"],
            },
            {
                "id": 2,
                "title": "2WIN",
                "handle": "2win",
                "vendor": "US Ophthalmic",
                "body_html": "",
                "images": [],
            },
        ],
        "collections": [
            {"id": 10, "handle": "autorefractors"},
            {"id": 11, "handle": "exam-room-essentials"},
            {"id": 12, "handle": "not-in-menu"},
        ],
    }


def test_import_writes_tree_products_brands_and_images(client, tmp_path):
    membership = {1: ["autorefractors"], 2: ["exam-room-essentials"]}
    calls = []

    def download(pairs):
        for url, destination in pairs:
            calls.append(url)
            destination.write_bytes(b"img")
        return set()

    report = asyncio.run(
        _import_catalog(_inventory(), membership, tmp_path, download, force=False, menu=TINY_MENU)
    )
    assert report.imported_products == 2
    assert report.imported_categories == len(lib.build_category_plan(TINY_MENU).rows)
    assert report.uncategorized == 0
    assert report.image_failures == 0
    assert calls == ["https://cdn.example.com/a.jpg"]
    assert (tmp_path / "shopify" / "efc-2600" / "0.jpg").read_bytes() == b"img"

    headers = admin_headers(client)
    categories = client.get("/api/admin/categories", headers=headers).json()
    by_slug = {c["slug"]: c for c in categories}
    exam = by_slug["exam-room-essentials"]
    autorefractors = by_slug["autorefractors"]
    assert autorefractors["parent_id"] == exam["id"]

    products = client.get("/api/admin/products", headers=headers).json()
    by_handle = {p["slug"]: p for p in products}
    imported = by_handle["efc-2600"]
    assert imported["orderable"] is False
    assert imported["description"] == "Retinal camera."
    assert imported["category_id"] == autorefractors["id"]
    assert imported["brand_id"] is not None
    assert imported["images"] == ["http://localhost:8000/media/shopify/efc-2600/0.jpg"]

    win = by_handle["2win"]
    assert win["brand_id"] is None
    assert win["category_id"] == exam["id"]
    assert win["images"] == []


def test_import_is_idempotent_and_force_replaces(client, tmp_path):
    membership = {1: ["autorefractors"]}

    def download(pairs):
        for _, destination in pairs:
            destination.write_bytes(b"img")
        return set()

    first = asyncio.run(
        _import_catalog(_inventory(), membership, tmp_path, download, force=False, menu=TINY_MENU)
    )
    assert first.imported_products == 2

    second = asyncio.run(
        _import_catalog(_inventory(), membership, tmp_path, download, force=False, menu=TINY_MENU)
    )
    assert second.skipped_existing is True
    assert second.imported_products == 0

    third = asyncio.run(
        _import_catalog(_inventory(), membership, tmp_path, download, force=True, menu=TINY_MENU)
    )
    assert third.imported_products == 2

    headers = admin_headers(client)
    products = client.get("/api/admin/products", headers=headers).json()
    assert len(products) == 2
