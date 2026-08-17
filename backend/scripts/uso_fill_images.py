"""Fill the image gap: attach sourced images to imageless catalog products (#28).

Consumes the per-handle sourcing map produced by research
(uso_image_sourcing.json — only verified entries are used), patches the
inventory file so re-imports keep the images, downloads the media into
media/shopify/<handle>/, and updates the already-imported database rows.

No --force re-import needed: only the affected products are touched.

Usage (from backend/):
    .venv/bin/python -m scripts.uso_fill_images \
        --inventory uso_inventory.json \
        --sourcing uso_image_sourcing.json
"""

import argparse
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.media import build_media_url
from app.models.catalog import Product
from scripts.uso_import_lib import image_destinations

Download = Callable[[list[tuple[str, Path]]], set[int]]


def patch_inventory(
    products: list[dict], sourcing: dict[str, dict]
) -> tuple[list[dict], list[str]]:
    """Attach sourced images/alts to products lacking them.

    Returns (patched products, handles patched). Products that already have
    images are never touched; unverified sourcing entries are ignored.
    """
    patched_handles: list[str] = []
    patched = []
    for product in products:
        handle = product["handle"]
        entry = sourcing.get(handle)
        if (
            entry
            and entry.get("verified")
            and entry.get("image_url")
            and not product.get("images")
        ):
            product["images"] = [entry["image_url"]]
            product["image_alts"] = [entry.get("alt") or product["title"]]
            patched_handles.append(handle)
        patched.append(product)
    return patched, patched_handles


async def update_products(
    handles: dict[str, dict], media_dir: Path, download: Download
) -> int:
    """Download media and update the imported rows for the given handles."""
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    pending: list[tuple[str, Path]] = []
    plans: dict[str, list[tuple[int, Path]]] = {}
    try:
        async with session_factory() as db:
            for handle, entry in handles.items():
                destinations = image_destinations(handle, [entry["image_url"]])
                url, relpath = destinations[0]
                destination = media_dir / relpath
                destination.parent.mkdir(parents=True, exist_ok=True)
                pending.append((url, destination))
                plans[handle] = [(len(pending) - 1, relpath)]

            failed = download(pending) if pending else set()

            updated = 0
            for handle, entries in plans.items():
                entry = handles[handle]
                images = [
                    build_media_url(relpath)
                    for index, relpath in entries
                    if index not in failed
                ]
                if not images:
                    continue
                row = (
                    await db.execute(select(Product).where(Product.slug == handle))
                ).scalar_one_or_none()
                if row is None:
                    continue
                row.images = images
                row.image_alt = [
                    entry.get("alt") or row.name or handle
                    for index, _relpath in entries
                    if index not in failed
                ]
                updated += 1
            await db.commit()
            return updated
    finally:
        await engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", default="uso_inventory.json")
    parser.add_argument("--sourcing", default="uso_image_sourcing.json")
    args = parser.parse_args()

    inventory_path = Path(args.inventory)
    inventory = json.loads(inventory_path.read_text())
    sourcing = json.loads(Path(args.sourcing).read_text())

    products, patched = patch_inventory(inventory["products"], sourcing)
    inventory_path.write_text(json.dumps(inventory, indent=2, ensure_ascii=False))

    verified = {
        handle: entry
        for handle, entry in sourcing.items()
        if entry.get("verified") and entry.get("image_url")
    }

    def download(pairs: list[tuple[str, Path]]) -> set[int]:
        def one(item: tuple[int, tuple[str, Path]]) -> int | None:
            index, (url, destination) = item
            if destination.exists():
                return None
            try:
                with httpx.stream(
                    "GET", url, timeout=60, follow_redirects=True
                ) as response:
                    response.raise_for_status()
                    destination.write_bytes(response.read())
                return None
            except Exception:
                return index

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = pool.map(one, enumerate(pairs))
        return {index for index in results if index is not None}

    updated = asyncio.run(
        update_products(
            verified,
            Path(settings.media_dir),
            download,
        )
    )

    print(f"Patched {len(patched)} products in {args.inventory}")
    print(f"Downloaded and attached images for {updated} imported products")
    missing = [h for h in patched if h not in verified]
    if missing:
        print(f"Skipped (no verified sourcing): {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
