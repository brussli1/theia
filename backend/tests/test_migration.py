from decimal import Decimal

from app.migration.strapi import (
    absolute_url,
    is_test_row,
    parse_brand,
    parse_category,
    parse_product,
    resolve_brand_name,
    slugify,
)

BASE = "http://168.138.133.221:1337"

MARCA_HUVITZ = {
    "id": 1,
    "attributes": {"Nombre": "Huvitz", "slug": "huvitz"},
}

CATEGORIA_ANALYTICAL = {
    "id": 1,
    "attributes": {"categoria": "ANALYTICAL INSTRUMENTS", "slug": "analytical-instruments"},
}

PRODUCT_VK2S = {
    "id": 1,
    "attributes": {
        "nombre": "High Performance Digital Imaging System VK-2s",
        "descripcion": "Fundus camera imaging system.",
        "precio": 1000000,
        "slug": "high-performance-digital-imaging-system-vk-2s",
        "marca": {"data": None},
        "categorias": {"data": [CATEGORIA_ANALYTICAL]},
        "foto": {
            "data": [
                {
                    "id": 1,
                    "attributes": {"url": "/uploads/o_1hjvm886p1a0l1n94db811mtttkr.jpg"},
                }
            ]
        },
    },
}

PRODUCT_HRK1 = {
    "id": 5,
    "attributes": {
        "nombre": "Auto-refractor Huvitz HRK-1",
        "descripcion": "Auto-refractor/keratometer.",
        "precio": 6850,
        "slug": "auto-refractor-huvitz-hrk-1",
        "marca": {"data": None},
        "categorias": {"data": [{"id": 3, "attributes": {"categoria": "Auto-refractores", "slug": "auto-refractores"}}]},
        "foto": {"data": []},
    },
}

PRODUCT_WITH_RELATION = {
    "id": 6,
    "attributes": {
        "nombre": "Some branded device",
        "descripcion": "",
        "precio": 500,
        "slug": "some-branded-device",
        "marca": {"data": MARCA_HUVITZ},
        "categorias": {"data": []},
        "foto": {"data": []},
    },
}


def test_is_test_row_excludes_placeholders():
    assert is_test_row("productos", {"attributes": {"nombre": "Test1", "slug": "test1"}})
    assert is_test_row("productos", {"attributes": {"nombre": "test2", "slug": "test2"}})
    assert is_test_row("marcas", {"attributes": {"Nombre": "marca2", "slug": "marca2"}})
    assert not is_test_row("productos", PRODUCT_VK2S)
    assert not is_test_row("marcas", MARCA_HUVITZ)


def test_parse_product_maps_strapi_record():
    product = parse_product(PRODUCT_VK2S, BASE)
    assert product["name"] == "High Performance Digital Imaging System VK-2s"
    assert product["slug"] == "high-performance-digital-imaging-system-vk-2s"
    assert product["description"] == "Fundus camera imaging system."
    assert product["price_gs"] == 1000000
    assert product["price_usd"] == Decimal("142.86")
    assert product["images"] == ["http://168.138.133.221:1337/uploads/o_1hjvm886p1a0l1n94db811mtttkr.jpg"]
    assert product["category_slug"] == "analytical-instruments"
    assert product["brand_name"] == "Kowa"


def test_parse_product_uses_custom_fx_rate():
    product = parse_product(PRODUCT_HRK1, BASE, fx_rate=6850)
    assert product["price_gs"] == 6850
    assert product["price_usd"] == Decimal("1.00")
    assert product["images"] == []


def test_resolve_brand_prefers_relation_then_keyword_then_override():
    assert resolve_brand_name(PRODUCT_WITH_RELATION["attributes"], "some-branded-device") == "Huvitz"
    assert resolve_brand_name(PRODUCT_HRK1["attributes"], "auto-refractor-huvitz-hrk-1") == "Huvitz"
    no_relation = {"nombre": "Kowa fundus camera", "marca": {"data": None}}
    assert resolve_brand_name(no_relation, "kowa-fundus-camera") == "Kowa"
    assert resolve_brand_name(PRODUCT_VK2S["attributes"], "high-performance-digital-imaging-system-vk-2s") == "Kowa"
    assert resolve_brand_name(
        {"nombre": "HHOU 7040 Refraction Units", "marca": {"data": None}},
        "hhou-7040-refraction-units",
    ) == "HHOU"
    unknown = {"nombre": "Generic device", "marca": {"data": None}}
    assert resolve_brand_name(unknown, "generic-device") is None


def test_parse_brand_and_category():
    assert parse_brand(MARCA_HUVITZ) == {"name": "Huvitz", "slug": "huvitz"}
    assert parse_category(CATEGORIA_ANALYTICAL) == {
        "name": "ANALYTICAL INSTRUMENTS",
        "slug": "analytical-instruments",
    }


def test_slugify_and_absolute_url():
    assert slugify("Auto-refractor HRK-1!") == "auto-refractor-hrk-1"
    assert absolute_url("/uploads/x.jpg", "http://host:1337") == "http://host:1337/uploads/x.jpg"
    assert absolute_url("http://cdn/x.jpg", "http://host:1337") == "http://cdn/x.jpg"
    assert absolute_url(None, "http://host:1337") == ""
