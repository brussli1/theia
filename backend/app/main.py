import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.account import router as account_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.cart import router as cart_router
from app.api.catalog import router as catalog_router
from app.api.collections import router as collections_router
from app.api.geo import router as geo_router
from app.api.health import router as health_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.products import router as products_router
from app.api.quotes import router as quotes_router
from app.core.admin import ensure_admin
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bootstrap the configured admin account (#15); a missing database at
    # startup must not take the API down — the panel simply waits.
    try:
        await ensure_admin()
    except Exception as exc:  # noqa: BLE001 - startup must stay up
        logger.warning("Admin bootstrap skipped: %s", exc)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.include_router(health_router)
app.include_router(products_router)
app.include_router(catalog_router)
app.include_router(geo_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(collections_router)
app.include_router(quotes_router)
app.include_router(auth_router)
app.include_router(account_router)
app.include_router(admin_router)

# Uploaded product images (#15): the browser loads them straight from the API.
media_path = Path(settings.media_dir)
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=media_path), name="media")
