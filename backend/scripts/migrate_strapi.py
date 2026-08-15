"""One-off script: migrate the live Strapi catalog into Postgres.

Usage (from backend/):
    alembic upgrade head
    python -m scripts.migrate_strapi

Env:
    STRAPI_BASE_URL   (default http://168.138.133.221:1337)
    FX_RATE           Gs per USD used to derive price_usd (default 7000)
"""

import asyncio
import logging
import os

from app.migration.strapi import DEFAULT_FX_RATE, run

logging.basicConfig(level=logging.INFO)


async def main() -> None:
    base_url = os.getenv("STRAPI_BASE_URL", "http://168.138.133.221:1337")
    fx_rate = int(os.getenv("FX_RATE", str(DEFAULT_FX_RATE)))
    result = await run(base_url, fx_rate)
    logging.info("Migration complete: %s", result)


if __name__ == "__main__":
    asyncio.run(main())
