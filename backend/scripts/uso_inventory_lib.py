"""Parsing and reporting helpers for the US Ophthalmic (Shopify) catalog crawl.

Pure functions over the public Shopify JSON shapes; the network loop is kept
thin and injectable so tests never touch the network.
"""

from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class Variant:
    title: str
    price: float
    available: bool


@dataclass
class Product:
    title: str
    handle: str
    vendor: str
    product_type: str
    tags: list[str] = field(default_factory=list)
    body_html: str = ""
    images: list[str] = field(default_factory=list)
    variants: list[Variant] = field(default_factory=list)
    published_at: str = ""


@dataclass
class Collection:
    id: int
    title: str
    handle: str
    products_count: int


def parse_products_page(raw: dict) -> list[Product]:
    return [parse_product(item) for item in raw.get("products", [])]


def parse_product(raw: dict) -> Product:
    return Product(
        title=raw.get("title") or "",
        handle=raw.get("handle") or "",
        vendor=raw.get("vendor") or "",
        product_type=raw.get("product_type") or "",
        tags=list(raw.get("tags") or []),
        body_html=raw.get("body_html") or "",
        images=[img["src"] for img in raw.get("images") or [] if img.get("src")],
        variants=[
            Variant(
                title=variant.get("title") or "",
                price=float(variant.get("price") or 0),
                available=bool(variant.get("available")),
            )
            for variant in raw.get("variants") or []
        ],
        published_at=raw.get("published_at") or "",
    )


def parse_collections_page(raw: dict) -> list[Collection]:
    return [
        Collection(
            id=item["id"],
            title=item.get("title") or "",
            handle=item.get("handle") or "",
            products_count=int(item.get("products_count") or 0),
        )
        for item in raw.get("collections", [])
    ]


def fetch_items(
    get_json: Callable[[str], dict], path: str, item_key: str, limit: int = 250
) -> list[Any]:
    """Paginates a Shopify JSON list endpoint until an empty page.

    `get_json(url)` is the injected fetcher (httpx in the CLI, a dict in
    tests). Raises RuntimeError if the very first page is empty, so a broken
    store or wrong path fails loudly instead of producing a silent empty
    inventory.
    """
    items: list[Any] = []
    page = 1
    while True:
        url = f"{path}?limit={limit}&page={page}"
        batch = get_json(url).get(item_key, [])
        if not batch:
            if page == 1:
                raise RuntimeError(f"first page of {path} came back empty")
            break
        items.extend(batch)
        page += 1
    return items


def build_report(products: list[Product]) -> dict:
    vendors = Counter(product.vendor for product in products)
    image_gaps = [
        {"handle": product.handle, "title": product.title}
        for product in products
        if not product.images
    ]
    quote_only = sum(
        1
        for product in products
        if product.variants and all(variant.price == 0 for variant in product.variants)
    )
    return {
        "product_count": len(products),
        "vendor_count": len(vendors),
        "vendors": [
            {"vendor": vendor, "count": count} for vendor, count in vendors.most_common()
        ],
        "image_gap_count": len(image_gaps),
        "image_gaps": image_gaps,
        "quote_only_count": quote_only,
        "total_images": sum(len(product.images) for product in products),
    }
