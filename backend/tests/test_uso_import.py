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


def test_build_category_plan_aliases_duplicate_handles_and_orders_parents_first():
    plan = lib.build_category_plan(TINY_MENU)
    slugs = [row.slug for row in plan.rows]
    assert len(set(slugs)) == len(plan.rows) - 1  # the second biometer is an alias

    biometer_rows = [row for row in plan.rows if row.handle == "biometer"]
    assert [row.slug for row in biometer_rows] == ["biometer", "biometer"]
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


def test_sanitize_description_html_keeps_allowlisted_structure():
    html = (
        "<p>The <strong>NTZ-BLP-6</strong> &amp; <em>friends</em>.</p>"
        "<h3>Section</h3><ul><li>One</li><li>Two</li></ul>"
    )
    assert lib.sanitize_description_html(html) == (
        "<p>The <strong>NTZ-BLP-6</strong> &amp; <em>friends</em>.</p>"
        "<h3>Section</h3><ul><li>One</li><li>Two</li></ul>"
    )


def test_sanitize_description_html_strips_tables_images_and_scripts():
    html = (
        "<p>Intro.</p><table><tr><td class=\"td1_table\">Key</td>"
        "<td class=\"td2_table\">Value</td></tr></table>"
        "<img src=\"https://evil.example/x.png\" onerror=\"alert(1)\">"
        "<script>alert('x')</script><p>Outro <br> line.</p>"
    )
    assert lib.sanitize_description_html(html) == "<p>Intro.</p><p>Outro <br> line.</p>"


def test_sanitize_description_html_drops_iris_blocks_and_unwraps_containers():
    html = (
        "<div><p>Lead in.</p><div id=\"iris-related\"><p>Related stuff</p>"
        "<a href=\"/collections/x\">cat</a></div><p>Tail.</p></div>"
    )
    assert lib.sanitize_description_html(html) == "<p>Lead in.</p><p>Tail.</p>"


def test_sanitize_description_html_escapes_text_and_filters_links():
    html = "<p>a &lt; b &gt; c &amp; d</p><a href=\"https://ok.example\">ok</a><a href=\"javascript:alert(1)\">bad</a>"
    out = lib.sanitize_description_html(html)
    assert "&lt;" in out and "&amp;" in out
    assert '<a href="https://ok.example" rel="noopener">ok</a>' in out
    assert "javascript" not in out
    assert lib.sanitize_description_html("") == ""


def test_sanitize_description_html_rejects_scheme_relative_and_internal_links():
    html = (
        '<a href="//evil.example/x">scheme-relative</a>'
        '<a href="/collections/binocularloupes">local</a>'
        '<a href="data:text/html,x">data</a>'
    )
    out = lib.sanitize_description_html(html)
    assert '<a href="//evil.example"' not in out
    assert "scheme-relative" in out  # the link text survives, the href does not
    assert '<a href="/collections/binocularloupes" rel="noopener">local</a>' in out
    assert "data:text" not in out


def test_sanitize_description_html_survives_unbalanced_drops():
    # Pathological unbalanced markup (an unclosed table followed by a flood of
    # unclosed tags) must not swallow the rest of the fragment: past a bounded
    # drop depth the drop is treated as closed.
    html = "<p>Lead.</p><table><tr><td>open" + "<div>" * 70 + "<p>Tail.</p>"
    assert lib.sanitize_description_html(html) == "<p>Lead.</p><p>Tail.</p>"


def test_clean_alt_takes_first_pipe_segment_and_normalizes():
    assert lib.clean_alt("Ezer ERK-770, , Autorefractor | Ezer, US Ophthalmic | more") == (
        "Ezer ERK-770, Autorefractor"
    )
    assert lib.clean_alt("  Just an alt  ") == "Just an alt"
    assert lib.clean_alt("") == ""


def test_extract_specifications_parses_genuine_two_column_tables():
    html = (
        "<table><tr><td class=\"td1_table\">Sphere Range</td>"
        "<td class=\"td2_table\">-20D to +20D</td></tr>"
        "<tr><td class=\"td1_table\">Weight</td>"
        "<td class=\"td2_table\">About 20KGS</td></tr></table>"
    )
    assert lib.extract_specifications(html) == [
        {"key": "Sphere Range", "value": "-20D to +20D"},
        {"key": "Weight", "value": "About 20KGS"},
    ]


def test_extract_specifications_ignores_layout_and_marketing_rows():
    html = (
        "<table><tr><td colspan=\"2\"><span class=\"title_table\">Features</span></td></tr>"
        "<tr bgcolor=\"#b0afaf\"><td></td><td></td></tr>"
        "<tr><td>2.5 Slit Illumination Head<br>Solid metal</td><td></td></tr>"
        "<tr><td>Zoom lens</td><td><img src=\"x.png\">flexible</td></tr>"
        "<tr><td><span class=\"explain_table\">Prose line.</span></td><td>More prose.</td></tr>"
        "</table>"
    )
    assert lib.extract_specifications(html) == []


def test_extract_specifications_dedupes_keys_and_skips_prose_keys():
    html = (
        "<table>"
        "<tr><td>Weight</td><td>1kg</td></tr>"
        "<tr><td>weight</td><td>2kg</td></tr>"
        "<tr><td>This is a long sentence explaining the feature.</td><td>value</td></tr>"
        "<tr><td>▪ Bullet point</td><td>value</td></tr>"
        "</table>"
    )
    assert lib.extract_specifications(html) == [{"key": "Weight", "value": "1kg"}]
    assert lib.extract_specifications("") == []
    assert lib.extract_specifications("<p>no tables here</p>") == []


def test_extract_specifications_ignores_marketing_tables_from_real_source():
    html = (
        "<table align=\"center\" width=\"95%\"><tbody><tr>"
        "<td valign=\"middle\" align=\"center\" width=\"40%\"><img src=\"a.jpg\"></td>"
        "<td width=\"5%\"></td><td><span class=\"title_table\">Digital Camera</span><br>"
        "<span class=\"explain_table\">High resolution.</span></td>"
        "</tr></tbody></table>"
    )
    assert lib.extract_specifications(html) == []


def test_available_options_uses_named_options_then_falls_back_to_variant_titles():
    product = {
        "options": [
            {"name": "Mounting Type", "values": ["Frame - White-Pink", "Headband", "Frame - White-Pink"]},
        ],
        "variants": [{"title": "Frame - White-Pink"}, {"title": "Headband"}],
    }
    assert lib.available_options(product) == "Frame - White-Pink, Headband"

    default_option = {
        "options": [{"name": "Title", "values": ["Default Title"]}],
        "variants": [{"title": "Default Title"}, {"title": "Black"}, {"title": "White"}],
    }
    assert lib.available_options(default_option) == "Black, White"

    assert lib.available_options({"options": [], "variants": [{"title": "Default Title"}]}) is None
    assert lib.available_options({}) is None


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
                "body_html": (
                    "<p>Retinal <b>camera</b> with <strong>widefield</strong> optics.</p>"
                    "<table><tr><td class=\"td1_table\">Resolution</td>"
                    "<td class=\"td2_table\">10M</td></tr></table>"
                    "<div id=\"iris-related\"><p>Related equipment</p></div>"
                ),
                "images": [
                    "https://cdn.example.com/a.jpg",
                    "https://cdn.example.com/b.jpg",
                ],
                "image_alts": [
                    "Ezer EFC-2600, , front | US Ophthalmic | boilerplate",
                    "",
                ],
                "options": [
                    {"name": "Mounting Type", "values": ["Frame", "Headband"]},
                ],
            },
            {
                "id": 2,
                "title": "2WIN",
                "handle": "2win",
                "vendor": "US Ophthalmic",
                "body_html": "",
                "images": ["https://cdn.example.com/win.jpg"],
                "image_alts": ["2WIN compact fundus camera"],
                "options": [],
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
    assert report.imported_categories == len(
        {row.slug for row in lib.build_category_plan(TINY_MENU).rows}
    )
    assert report.uncategorized == 0
    assert report.image_failures == 0
    assert report.image_gap_handles == []
    assert calls == [
        "https://cdn.example.com/a.jpg",
        "https://cdn.example.com/b.jpg",
        "https://cdn.example.com/win.jpg",
    ]
    assert (tmp_path / "shopify" / "efc-2600" / "0.jpg").read_bytes() == b"img"
    assert (tmp_path / "shopify" / "efc-2600" / "1.jpg").read_bytes() == b"img"

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
    assert imported["description"] == "Retinal camera with widefield optics."
    assert imported["description_html"] == (
        "<p>Retinal <b>camera</b> with <strong>widefield</strong> optics.</p>"
    )
    assert imported["images"] == [
        "http://localhost:8000/media/shopify/efc-2600/0.jpg",
        "http://localhost:8000/media/shopify/efc-2600/1.jpg",
    ]
    assert imported["image_alt"] == ["Ezer EFC-2600, front", "Ezer EFC-2600"]
    assert imported["specifications"] == [
        {"key": "Resolution", "value": "10M"},
        {"key": "Available options", "value": "Frame, Headband"},
    ]
    assert imported["category_id"] == autorefractors["id"]
    assert imported["brand_id"] is not None

    win = by_handle["2win"]
    assert win["brand_id"] is None
    assert win["category_id"] == exam["id"]
    assert win["images"] == ["http://localhost:8000/media/shopify/2win/0.jpg"]
    assert win["image_alt"] == ["2WIN compact fundus camera"]
    assert win["description_html"] == ""
    assert win["specifications"] == []


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
    # The force path must preserve the content-fidelity fields.
    by_slug = {p["slug"]: p for p in products}
    efc = by_slug["efc-2600"]
    assert efc["description_html"].startswith("<p>Retinal <b>camera</b>")
    assert efc["image_alt"] == ["Ezer EFC-2600, front", "Ezer EFC-2600"]
    assert efc["specifications"] == [
        {"key": "Resolution", "value": "10M"},
        {"key": "Available options", "value": "Frame, Headband"},
    ]
