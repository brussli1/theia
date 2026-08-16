"""Import the USO inventory (see uso_inventory.py) into Theia's database.

Categories mirror the curated USO menu (parents, subgroups, leaf collections);
brands come from product vendors; products import as quote-only with
plain-text descriptions and images downloaded into the media directory.

Idempotent: a re-run without --force skips when imported products exist.
--force replaces only the imported catalog (demo and manually created
products are untouched).

Usage (from backend/):
    .venv/bin/python -m scripts.uso_inventory --out uso_inventory.json   # first
    .venv/bin/python -m scripts.uso_import --inventory uso_inventory.json
"""

import argparse
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import sync_sequences
from app.core.media import build_media_url
from app.models.catalog import Brand, Category, Product
from scripts.uso_import_lib import (
    USO_MENU,
    ImportReport,
    assign_category,
    available_options,
    brand_from_vendor,
    build_category_plan,
    clean_alt,
    extract_specifications,
    fetch_collection_membership,
    html_to_text,
    image_destinations,
    sanitize_description_html,
    slugify,
    unique_slug,
)
from scripts.uso_inventory_lib import fetch_with_backoff

BASE_URL = "https://usophthalmic.com"

Download = Callable[[list[tuple[str, Path]]], set[int]]


async def _import_catalog(
    inventory: dict,
    membership: dict[int, list[str]],
    media_dir: Path,
    download: Download,
    force: bool,
    menu: list | None = None,
    state_file: Path | None = None,
) -> ImportReport:
    plan = build_category_plan(menu if menu is not None else USO_MENU)
    plan_slugs = {row.slug for row in plan.rows}

    products = inventory["products"]

    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    previous_state: dict = (
        json.loads(state_file.read_text())
        if state_file is not None and state_file.exists()
        else {}
    )
    try:
        async with session_factory() as db:
            existing_slugs = set((await db.execute(select(Product.slug))).scalars())
            inventory_slugs = {p["handle"] for p in products}
            already_imported = existing_slugs & (
                inventory_slugs | set(previous_state.get("product_slugs", []))
            )
            if already_imported and not force:
                return ImportReport(
                    imported_products=0,
                    imported_categories=0,
                    imported_brands=0,
                    uncategorized=0,
                    image_failures=0,
                    skipped_existing=True,
                )
            if force and already_imported:
                await db.execute(delete(Product).where(Product.slug.in_(already_imported)))
                state_category_slugs = set(previous_state.get("category_slugs", []))
                await db.execute(
                    delete(Category).where(Category.slug.in_(plan_slugs | state_category_slugs))
                )
                await db.flush()

            # Read after any force-delete so re-imported rows keep their clean
            # Shopify handles instead of gaining -2 suffixes.
            taken_slugs = set((await db.execute(select(Product.slug))).scalars())

            # Categories: rows are parent-first; resolve slug -> id as we go.
            # Rows may repeat a slug (menu aliases share one category).
            category_ids: dict[str, int] = {}
            for row in plan.rows:
                if row.slug in category_ids:
                    continue
                category = Category(
                    name=row.name,
                    slug=row.slug,
                    parent_id=category_ids.get(row.parent_slug),
                )
                db.add(category)
                await db.flush()
                category_ids[row.slug] = category.id

            # Brands: upsert by slug, reusing existing (incl. demo) brands.
            existing_brands = (await db.execute(select(Brand.id, Brand.name, Brand.slug))).all()
            brand_ids: dict[str, int] = {row.name: row.id for row in existing_brands}
            brand_slugs: set[str] = {row.slug for row in existing_brands}
            for name in {
                brand_from_vendor(p["vendor"])
                for p in products
                if brand_from_vendor(p["vendor"])
            }:
                if name not in brand_ids:
                    brand = Brand(name=name, slug=unique_slug(slugify(name), brand_slugs))
                    db.add(brand)
                    await db.flush()
                    brand_ids[name] = brand.id

            uncategorized = 0
            uncategorized_handles: list[str] = []
            image_gap_handles: list[str] = []
            imported = 0

            pending_downloads: list[tuple[str, Path]] = []
            product_image_plans: list[tuple[dict, list[tuple[int, Path]]]] = []
            for product in products:
                handle = product["handle"]
                if not handle:
                    continue
                destinations = image_destinations(handle, product.get("images") or [])
                entries: list[tuple[int, Path]] = []
                for url, relpath in destinations:
                    destination = media_dir / relpath
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    pending_downloads.append((url, destination))
                    entries.append((len(pending_downloads) - 1, relpath))
                product_image_plans.append((product, entries))

            failed_downloads = download(pending_downloads) if pending_downloads else set()
            image_failures = len(failed_downloads)

            for product, entries in product_image_plans:
                handle = product["handle"]
                category_slug = assign_category(
                    membership.get(product["id"], []),
                    plan,
                )
                if category_slug is None:
                    uncategorized += 1
                    uncategorized_handles.append(handle)
                if not product.get("images"):
                    image_gap_handles.append(handle)

                vendor_brand = brand_from_vendor(product["vendor"])
                images = [
                    build_media_url(relpath)
                    for index, relpath in entries
                    if index not in failed_downloads
                ]
                alts = product.get("image_alts") or []
                image_alt = [
                    clean_alt(alts[position]) or (product["title"] or handle)
                    for position, (index, _relpath) in enumerate(entries)
                    if index not in failed_downloads
                ]

                specifications = extract_specifications(
                    product.get("body_html") or ""
                )
                options = available_options(product)
                if options:
                    specifications.append({"key": "Available options", "value": options})

                # The plain description is the sanitized fragment flattened:
                # iris marketing copy, tables and inline images never reach
                # either field (D1/D2/D8).
                description_html = sanitize_description_html(
                    product.get("body_html") or ""
                )

                db.add(
                    Product(
                        name=product["title"] or handle,
                        slug=unique_slug(handle, taken_slugs),
                        description=html_to_text(description_html),
                        description_html=description_html,
                        price_gs=0,
                        price_usd=0,
                        available=True,
                        orderable=False,
                        certifications=[],
                        images=images,
                        image_alt=image_alt,
                        specifications=specifications,
                        category_id=category_ids.get(category_slug),
                        brand_id=brand_ids.get(vendor_brand) if vendor_brand else None,
                    )
                )
                imported += 1

            await db.commit()

            await sync_sequences(db, "products", "categories", "brands")
            await db.commit()

            if state_file is not None:
                state_file.write_text(
                    json.dumps(
                        {
                            "product_slugs": sorted(inventory_slugs),
                            "category_slugs": sorted(plan_slugs),
                        }
                    )
                )

            return ImportReport(
                imported_products=imported,
                imported_categories=len({row.slug for row in plan.rows}),
                imported_brands=len(brand_ids),
                uncategorized=uncategorized,
                image_failures=image_failures,
                skipped_existing=False,
                uncategorized_handles=uncategorized_handles,
                image_gap_count=len(image_gap_handles),
                image_gap_handles=image_gap_handles,
            )
    finally:
        await engine.dispose()
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", default="uso_inventory.json")
    parser.add_argument("--force", action="store_true")
    parser.add_argument(
        "--refresh-membership",
        action="store_true",
        help="re-crawl collection membership instead of using uso_membership.json",
    )
    args = parser.parse_args()

    inventory = json.loads(Path(args.inventory).read_text())

    membership_cache = Path("uso_membership.json")
    if membership_cache.exists() and not args.refresh_membership:
        membership = {
            int(product_id): handles
            for product_id, handles in json.loads(membership_cache.read_text()).items()
        }
        membership_failures = 0
        failed_handles: list[str] = []
        print(f"Using cached membership from {membership_cache}")
    else:
        with httpx.Client(follow_redirects=True) as client:
            fetch = fetch_with_backoff(client, BASE_URL, retries=4, delay=3.0)
            membership, membership_failures, failed_handles = fetch_collection_membership(
                fetch, inventory["collections"]
            )
        membership_cache.write_text(
            json.dumps({str(key): value for key, value in membership.items()})
        )

    def download(pairs: list[tuple[str, Path]]) -> set[int]:
        def one(item: tuple[int, tuple[str, Path]]) -> int | None:
            index, (url, destination) = item
            if destination.exists():
                return None
            try:
                with httpx.stream("GET", url, timeout=60, follow_redirects=True) as response:
                    response.raise_for_status()
                    destination.write_bytes(response.read())
                return None
            except Exception:
                return index

        with ThreadPoolExecutor(max_workers=16) as pool:
            results = pool.map(one, enumerate(pairs))
        return {index for index in results if index is not None}

    report = asyncio.run(
        _import_catalog(
            inventory=inventory,
            membership=membership,
            media_dir=Path(settings.media_dir),
            download=download,
            force=args.force,
            state_file=Path("uso_import_state.json"),
        )
    )

    if report.skipped_existing:
        print("Import skipped: imported products already exist (use --force to replace).")
        return 0
    print(f"Imported {report.imported_products} products "
          f"({report.uncategorized} without a menu category)")
    print(f"Imported {report.imported_categories} categories, {report.imported_brands} brands")
    print(f"Image download failures: {report.image_failures}")
    print(f"Products without source images: {report.image_gap_count}")
    if report.image_gap_handles:
        Path("uso_imageless.json").write_text(
            json.dumps(report.image_gap_handles, indent=2)
        )
        print("Image-less products written to uso_imageless.json")
    print(f"Collections that failed to crawl: {membership_failures}")
    if failed_handles:
        print(f"Failed collection handles: {', '.join(failed_handles)}")
    if report.uncategorized_handles:
        Path("uso_uncategorized.json").write_text(
            json.dumps(report.uncategorized_handles, indent=2)
        )
        print("Uncategorized products written to uso_uncategorized.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
