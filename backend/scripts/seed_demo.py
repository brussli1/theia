"""Seed a small deterministic catalog for E2E / local demos.

Idempotent: does nothing when products already exist, unless --force is
given (then the catalog tables are cleared and reseeded).

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
from app.testing.demo_catalog import BRANDS, CATEGORIES, PRODUCTS

logging.basicConfig(level=logging.INFO)


async def run(force: bool = False) -> bool:
    async with async_session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(Product))
        if count and not force:
            logging.info("Products already present (%s); skipping seed.", count)
            return False
        if force and count:
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
                    specifications=[],
                    category_id=category_id,
                    brand_id=brand_id,
                    created_at=created_at,
                )
            )
        await session.commit()
        logging.info("Seeded %s products.", len(PRODUCTS))
        return True


if __name__ == "__main__":
    force = "--force" in sys.argv
    asyncio.run(run(force=force))
