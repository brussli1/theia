from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import CategoryFacet, Facet
from app.core.database import get_db
from app.models.catalog import Brand, Category

router = APIRouter(tags=["catalog"])


@router.get("/api/categories", response_model=list[CategoryFacet])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryFacet]:
    rows = (
        await db.execute(
            select(Category.slug, Category.name, Category.parent_id).order_by(
                Category.name
            )
        )
    ).all()
    return [
        CategoryFacet(slug=slug, name=name, parent_id=parent_id)
        for slug, name, parent_id in rows
    ]


@router.get("/api/brands", response_model=list[Facet])
async def list_brands(db: AsyncSession = Depends(get_db)) -> list[Facet]:
    rows = (
        await db.execute(select(Brand.slug, Brand.name).order_by(Brand.name))
    ).all()
    return [Facet(slug=slug, name=name) for slug, name in rows]
