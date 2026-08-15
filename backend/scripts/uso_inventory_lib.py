"""Parsing and reporting helpers for the US Ophthalmic (Shopify) catalog crawl.

Pure functions over the public Shopify JSON shapes; the network loop is kept
thin and injectable so tests never touch the network.
"""

from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Callable

MAX_PAGES = 200


@dataclass
class Variant:
    title: str
    # None when the source has no usable price (missing or malformed).
    price: float | None


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


@dataclass
class Gap:
    handle: str
    title: str


@dataclass
class VendorCount:
    vendor: str
    count: int


@dataclass
class Report:
    product_count: int
    vendor_count: int
    vendors: list[VendorCount]
    image_gap_count: int
    image_gaps: list[Gap]
    quote_only_count: int
    quote_only: list[Gap]
    unpriced_count: int
    total_images: int


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
        variants=[parse_variant(item) for item in raw.get("variants") or []],
        published_at=raw.get("published_at") or "",
    )


def parse_variant(raw: dict) -> Variant:
    price_raw = raw.get("price")
    price = None if price_raw in (None, "") else float(price_raw)
    return Variant(title=raw.get("title") or "", price=price)


def parse_collections_page(raw: dict) -> list[Collection]:
    return [
        Collection(
            id=int(item.get("id") or 0),
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
    tests). Raises RuntimeError if the very first page is empty (a broken
    store or wrong path must fail loudly, not produce a silent empty
    inventory) or if pagination never terminates.
    """
    items: list[Any] = []
    page = 1
    while page <= MAX_PAGES:
        url = f"{path}?limit={limit}&page={page}"
        batch = get_json(url).get(item_key, [])
        if not batch:
            if page == 1:
                raise RuntimeError(f"first page of {path} came back empty")
            return items
        items.extend(batch)
        page += 1
    raise RuntimeError(f"{path} did not terminate within {MAX_PAGES} pages")


def build_report(products: list[Product]) -> Report:
    vendors = Counter(product.vendor for product in products)
    image_gaps = [Gap(p.handle, p.title) for p in products if not p.images]
    priced = [
        p for p in products if p.variants and all(v.price is not None for v in p.variants)
    ]
    quote_only = [p for p in priced if all(v.price == 0 for v in p.variants)]
    unpriced = [p for p in products if p not in priced]
    return Report(
        product_count=len(products),
        vendor_count=len(vendors),
        vendors=[VendorCount(vendor, count) for vendor, count in vendors.most_common()],
        image_gap_count=len(image_gaps),
        image_gaps=image_gaps,
        quote_only_count=len(quote_only),
        quote_only=[Gap(p.handle, p.title) for p in quote_only],
        unpriced_count=len(unpriced),
        total_images=sum(len(p.images) for p in products),
    )
