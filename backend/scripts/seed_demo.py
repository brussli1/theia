"""Seed a small deterministic catalog for E2E / local demos.

Idempotent: does nothing when products already exist, unless --force is
given (then the catalog tables are cleared and reseeded). Collections are
seeded independently, so an existing database upgraded past the collections
migration still gets its homepage lists.

Usage (from backend/):
    alembic upgrade head
    python -m scripts.seed_demo [--force]
"""

import asyncio
import logging
import sys

from sqlalchemy import delete, func, select

from app.core.database import async_session_factory
from app.models.catalog import Brand, Category, Product
from app.models.collections import Collection, CollectionProduct
from app.testing.demo_catalog import BRANDS, CATEGORIES, COLLECTIONS, PRODUCTS

logging.basicConfig(level=logging.INFO)


async def run(force: bool = False) -> bool:
    async with async_session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        collection_count = await session.scalar(
            select(func.count()).select_from(Collection)
        )
        if count and not force:
            if collection_count:
                logging.info("Products already present (%s); skipping seed.", count)
                return False
            await _seed_collections(session)
            await session.commit()
            logging.info("Seeded %s collections.", len(COLLECTIONS))
            return True
        if force and count:
            await session.execute(delete(Collection))
            await session.execute(delete(Product))
            await session.execute(delete(Brand))
            await session.execute(delete(Category))
            await session.flush()
        for id, name, slug in CATEGORIES:
            session.add(Category(id=id, name=name, slug=slug))
        for id, name, slug in BRANDS:
            session.add(Brand(id=id, name=name, slug=slug))
        for (
            id,
            name,
            slug,
            description,
            price_gs,
            price_usd,
            available,
            orderable,
            certifications,
            images,
            specifications,
            category_id,
            brand_id,
            created_at,
        ) in PRODUCTS:
            session.add(
                Product(
                    id=id,
                    name=name,
                    slug=slug,
                    description=description,
                    price_gs=price_gs,
                    price_usd=price_usd,
                    available=available,
                    orderable=orderable,
                    certifications=certifications,
                    images=images,
                    specifications=specifications,
                    category_id=category_id,
                    brand_id=brand_id,
                    created_at=created_at,
                )
            )
        await session.commit()
        await _seed_collections(session)
        await session.commit()
        logging.info("Seeded %s products.", len(PRODUCTS))
        return True


async def _seed_collections(session) -> None:
    for ctype, links in COLLECTIONS:
        collection = Collection(type=ctype)
        session.add(collection)
        await session.flush()
        for product_id, position in links:
            session.add(
                CollectionProduct(
                    collection_id=collection.id,
                    product_id=product_id,
                    position=position,
                )
            )


if __name__ == "__main__":
    force = "--force" in sys.argv
    asyncio.run(run(force=force))
