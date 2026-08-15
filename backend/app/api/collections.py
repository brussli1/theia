from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.cards import product_card
from app.api.schemas import CollectionOut
from app.core.database import get_db
from app.models.collections import Collection, CollectionProduct
from app.models.catalog import Brand, Category, Product

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=list[CollectionOut])
async def list_collections(db: AsyncSession = Depends(get_db)) -> list[CollectionOut]:
    collections = (
        await db.execute(select(Collection).order_by(Collection.type))
    ).scalars().all()
    rows = (
        await db.execute(
            select(Collection, CollectionProduct, Product, Brand.name, Category.name)
            .join(CollectionProduct, CollectionProduct.collection_id == Collection.id)
            .join(Product, Product.id == CollectionProduct.product_id)
            .join(Brand, Brand.id == Product.brand_id, isouter=True)
            .join(Category, Category.id == Product.category_id, isouter=True)
            .order_by(Collection.type, CollectionProduct.position)
        )
    ).all()

    grouped: dict[int, list] = {}
    for collection, link, product, brand_name, category_name in rows:
        grouped.setdefault(collection.id, []).append(
            product_card(product, brand_name, category_name)
        )
    return [
        CollectionOut(type=collection.type, products=grouped.get(collection.id, []))
        for collection in collections
    ]
