"""Crawl the US Ophthalmic (Shopify) public catalog into a local inventory.

Produces a JSON inventory file (products, collections, report) plus a printed
report for human review — no database writes. Read-only against the source.

Usage (from backend/):
    .venv/bin/python -m scripts.uso_inventory --out uso_inventory.json
"""

import argparse
import json
from dataclasses import asdict
from pathlib import Path

import httpx

from scripts.uso_inventory_lib import (
    build_report,
    fetch_items,
    fetch_with_backoff,
    parse_collections_page,
    parse_products_page,
)

BASE_URL = "https://usophthalmic.com"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="uso_inventory.json")
    args = parser.parse_args()

    with httpx.Client(follow_redirects=True) as client:
        fetch = fetch_with_backoff(client, BASE_URL)
        raw_products = fetch_items(fetch, "/products.json", "products")
        raw_collections = fetch_items(fetch, "/collections.json", "collections")

    products = parse_products_page({"products": raw_products})
    collections = parse_collections_page({"collections": raw_collections})
    report = build_report(products)

    inventory = {
        "products": [asdict(product) for product in products],
        "collections": [asdict(collection) for collection in collections],
        "report": asdict(report),
    }
    Path(args.out).write_text(json.dumps(inventory, indent=2, ensure_ascii=False))

    print(f"Saved {len(products)} products and {len(collections)} collections to {args.out}")
    print(f"Quote-only products: {report.quote_only_count}")
    for gap in report.quote_only:
        print(f"  - {gap.handle} ({gap.title})")
    print(f"Unpriced products (no usable price): {report.unpriced_count}")
    print(f"Products without images: {report.image_gap_count}")
    print(f"Vendors ({report.vendor_count}):")
    for row in report.vendors:
        print(f"  {row.count:4d}  {row.vendor}")
    if report.image_gaps:
        print("Image gaps:")
        for gap in report.image_gaps:
            print(f"  - {gap.handle} ({gap.title})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
