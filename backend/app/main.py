from fastapi import FastAPI

from app.api.account import router as account_router
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
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

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
