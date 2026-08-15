"""Strapi -> Theia catalog migration.

Reads the read-only Strapi instance (categorias, marcas, productos + images)
and maps them onto the Catalog model (Category, Brand, Product).

Test rows are excluded: products named "Test1"/"test2" and the brand "marca2".

Strapi stores a single ``precio`` integer. It is treated as Guaraní and stored
in ``price_gs``; ``price_usd`` is derived with ``FX_RATE`` (Gs per USD).
"""

import logging
import re
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import httpx
from sqlalchemy import delete

from app.core.database import async_session_factory
from app.models.catalog import Brand, Category, Product

logger = logging.getLogger(__name__)

TEST_PRODUCT_NAMES = {"test1", "test2"}
TEST_BRAND_NAMES = {"marca2"}

BRAND_BY_SLUG = {
    "high-performance-digital-imaging-system-vk-2s": "Kowa",
    "hhou-7040-refraction-units": "HHOU",
}

DEFAULT_FX_RATE = 7000


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "unnamed"


def is_test_row(kind: str, record: dict) -> bool:
    attributes = record["attributes"]
    if kind == "marcas":
        return attributes.get("Nombre", "").strip().lower() in TEST_BRAND_NAMES
    if kind == "productos":
        name = attributes.get("nombre", "").strip().lower()
        slug = attributes.get("slug", "")
        return name in TEST_PRODUCT_NAMES or slug.startswith("test")
    return False


def absolute_url(path: str | None, base_url: str) -> str:
    if not path:
        return ""
    if path.startswith("http"):
        return path
    return base_url.rstrip("/") + path


def parse_brand(record: dict) -> dict:
    attributes = record["attributes"]
    name = attributes.get("Nombre") or attributes.get("nombre") or ""
    slug = attributes.get("slug") or slugify(name)
    return {"name": name.strip(), "slug": slug}


def parse_category(record: dict) -> dict:
    attributes = record["attributes"]
    name = attributes.get("categoria") or ""
    slug = attributes.get("slug") or slugify(name)
    return {"name": name.strip(), "slug": slug}


def resolve_brand_name(product_attributes: dict, slug: str) -> str | None:
    related = (product_attributes.get("marca") or {}).get("data")
    if related:
        name = related["attributes"].get("Nombre") or related["attributes"].get("nombre")
        if name:
            return name.strip()
    name = product_attributes.get("nombre") or ""
    lowered = name.lower()
    for keyword, brand in (("kowa", "Kowa"), ("huvitz", "Huvitz")):
        if keyword in lowered:
            return brand
    return BRAND_BY_SLUG.get(slug)


def parse_product(
    record: dict,
    base_url: str,
    fx_rate: int | float = DEFAULT_FX_RATE,
) -> dict:
    attributes = record["attributes"]
    slug = attributes.get("slug") or slugify(attributes.get("nombre") or "")
    price_gs = int(attributes.get("precio") or 0)
    price_usd = Decimal(str(price_gs / fx_rate)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    images = [
        absolute_url(image["attributes"].get("url"), base_url)
        for image in ((attributes.get("foto") or {}).get("data") or [])
    ]
    categories = ((attributes.get("categorias") or {}).get("data") or [])
    category_slug = None
    if categories:
        first = categories[0]["attributes"]
        category_slug = first.get("slug") or slugify(first.get("categoria") or "")
    brand_name = resolve_brand_name(attributes, slug)
    created_at = None
    raw_created = attributes.get("createdAt")
    if raw_created:
        try:
            created_at = datetime.fromisoformat(raw_created)
        except ValueError:
            created_at = None
    return {
        "name": (attributes.get("nombre") or "").strip(),
        "slug": slug,
        "description": attributes.get("descripcion") or "",
        "price_gs": price_gs,
        "price_usd": price_usd,
        "images": images,
        "category_slug": category_slug,
        "brand_name": brand_name,
        "created_at": created_at,
    }


async def _fetch_all(client: httpx.AsyncClient, endpoint: str) -> list[dict]:
    records: list[dict] = []
    page = 1
    while True:
        response = await client.get(
            f"/api/{endpoint}",
            params={"populate": "*", "pagination[page]": page, "pagination[pageSize]": 100},
        )
        response.raise_for_status()
        payload = response.json()
        records.extend(payload["data"])
        meta = payload.get("meta", {}).get("pagination", {})
        if page >= meta.get("pageCount", 1):
            return records
        page += 1


async def run(
    base_url: str,
    fx_rate: int | float = DEFAULT_FX_RATE,
) -> dict:
    async with httpx.AsyncClient(base_url=base_url, timeout=30) as client:
        brands = [r for r in await _fetch_all(client, "marcas") if not is_test_row("marcas", r)]
        categories = await _fetch_all(client, "categorias")
        products = [r for r in await _fetch_all(client, "productos") if not is_test_row("productos", r)]

    async with async_session_factory() as session:
        async with session.begin():
            await session.execute(delete(Product))
            await session.execute(delete(Brand))
            await session.execute(delete(Category))

            brand_id_by_name: dict[str, int] = {}
            for record in brands:
                data = parse_brand(record)
                brand = Brand(**data)
                session.add(brand)
                await session.flush()
                brand_id_by_name[data["name"].lower()] = brand.id

            category_id_by_slug: dict[str, int] = {}
            for record in categories:
                data = parse_category(record)
                category = Category(**data)
                session.add(category)
                await session.flush()
                category_id_by_slug[data["slug"]] = category.id

            seeded = []
            for record in products:
                data = parse_product(record, base_url, fx_rate)
                brand_id = None
                if data["brand_name"]:
                    name = data["brand_name"].lower()
                    if name not in brand_id_by_name:
                        brand = Brand(name=data["brand_name"], slug=slugify(data["brand_name"]))
                        session.add(brand)
                        await session.flush()
                        brand_id_by_name[name] = brand.id
                    brand_id = brand_id_by_name[name]
                category_id = category_id_by_slug.get(data["category_slug"])
                product = Product(
                    name=data["name"],
                    slug=data["slug"],
                    description=data["description"],
                    price_gs=data["price_gs"],
                    price_usd=data["price_usd"],
                    images=data["images"],
                    category_id=category_id,
                    brand_id=brand_id,
                    created_at=data["created_at"],
                )
                session.add(product)
                seeded.append(product.slug)

    return {
        "brands": len(brand_id_by_name),
        "categories": len(category_id_by_slug),
        "products": seeded,
    }
