from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.cards import product_card
from app.api.schemas import Facet, ProductCard, ProductDetail, ProductPage
from app.core.database import get_db
from app.models.catalog import Brand, Category, Product

router = APIRouter(prefix="/api/products", tags=["products"])

CERTIFICATIONS = {"FDA", "CE", "ISO"}


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _select_with_names() -> Select:
    return (
        select(Product, Brand.name, Category.name)
        .join(Brand, Brand.id == Product.brand_id, isouter=True)
        .join(Category, Category.id == Product.category_id, isouter=True)
    )


@router.get("", response_model=ProductPage)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    q: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    certification: str | None = None,
    price_min: int | None = Query(None, ge=0),
    price_max: int | None = Query(None, ge=0),
    sort: str = Query("newest"),
    db: AsyncSession = Depends(get_db),
) -> ProductPage:
    if certification is not None and certification.upper() not in CERTIFICATIONS:
        raise HTTPException(status_code=422, detail="certification must be one of FDA, CE, ISO")

    statement = _select_with_names()

    if q:
        pattern = f"%{_escape_like(q)}%"
        statement = statement.where(
            or_(
                Product.name.ilike(pattern, escape="\\"),
                Product.description.ilike(pattern, escape="\\"),
            )
        )
    if category:
        statement = statement.where(Category.slug == category)
    if brand:
        statement = statement.where(Brand.slug == brand)
    if certification:
        statement = statement.where(Product.certifications.any(certification.upper()))
    if price_min is not None:
        statement = statement.where(Product.price_gs >= price_min)
    if price_max is not None:
        statement = statement.where(Product.price_gs <= price_max)

    if sort == "price_asc":
        statement = statement.order_by(Product.price_gs.asc())
    elif sort == "price_desc":
        statement = statement.order_by(Product.price_gs.desc())
    else:
        statement = statement.order_by(Product.created_at.desc())

    total = await db.scalar(select(func.count()).select_from(statement.subquery()))
    rows = (
        await db.execute(statement.offset((page - 1) * page_size).limit(page_size))
    ).all()

    items = [
        product_card(product, brand_name, category_name)
        for product, brand_name, category_name in rows
    ]
    pages = (total + page_size - 1) // page_size if total else 0
    category_rows = (await db.execute(select(Category.slug, Category.name))).all()
    brand_rows = (await db.execute(select(Brand.slug, Brand.name))).all()
    return ProductPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
        categories=[Facet(slug=slug, name=name) for slug, name in category_rows],
        brands=[Facet(slug=slug, name=name) for slug, name in brand_rows],
    )


@router.get("/{slug}", response_model=ProductDetail)
async def get_product(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> ProductDetail:
    row = (
        await db.execute(
            _select_with_names().where(Product.slug == slug)
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")

    product, brand_name, category_name = row
    return ProductDetail(
        id=product.id,
        slug=product.slug,
        name=product.name,
        description=product.description,
        price_gs=product.price_gs,
        price_usd=f"{product.price_usd:.2f}",
        images=product.images,
        specifications=product.specifications,
        available=product.available,
        orderable=product.orderable,
        certifications=product.certifications,
        brand=brand_name,
        category=category_name,
    )
