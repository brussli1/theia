from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.products import router as products_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.include_router(health_router)
app.include_router(products_router)
