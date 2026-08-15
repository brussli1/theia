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
    parse_collections_page,
    parse_products_page,
)


def get_json(client: httpx.Client, base: str):
    def fetch(url: str) -> dict:
        response = client.get(f"{base}{url}", timeout=30)
        response.raise_for_status()
        return response.json()

    return fetch


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://usophthalmic.com")
    parser.add_argument("--out", default="uso_inventory.json")
    parser.add_argument("--limit", type=int, default=250)
    args = parser.parse_args()

    with httpx.Client(follow_redirects=True) as client:
        fetch = get_json(client, args.base)
        raw_products = fetch_items(fetch, "/products.json", "products", args.limit)
        raw_collections = fetch_items(fetch, "/collections.json", "collections", 250)

    products = parse_products_page({"products": raw_products})
    collections = parse_collections_page({"collections": raw_collections})
    report = build_report(products)

    inventory = {
        "products": [asdict(product) for product in products],
        "collections": [asdict(collection) for collection in collections],
        "report": report,
    }
    Path(args.out).write_text(json.dumps(inventory, indent=2, ensure_ascii=False))

    print(f"Saved {len(products)} products and {len(collections)} collections to {args.out}")
    print(f"Quote-only products: {report['quote_only_count']}")
    print(f"Products without images: {report['image_gap_count']}")
    print(f"Vendors ({report['vendor_count']}):")
    for row in report["vendors"]:
        print(f"  {row['count']:4d}  {row['vendor']}")
    if report["image_gaps"]:
        print("Image gaps:")
        for gap in report["image_gaps"]:
            print(f"  - {gap['handle']} ({gap['title']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
