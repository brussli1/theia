"""Admin panel — catalog, orders and quotes (tickets #15, #16).

Everything here is account-only: every endpoint depends on `get_current_admin`
(401 without a session, 403 for a signed-in customer). Registration never
grants the role — the configured bootstrap admin does (app/core/admin.py).
The panel manages the catalog tables the storefront reads: products (create /
edit / deactivate — there is no hard delete, orders and collections reference
products), categories and brands (full CRUD, products fall back to
uncategorized/unbranded via SET NULL), the curated homepage collections, and
product image uploads to the backend's `/media` mount. Order and quote
requests are read and their status moved along: setting an order `paid` also
confirms its pending payment — the manual path for Western Union transfers.
"""

import re
import unicodedata
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_admin
from app.api.orders import order_out
from app.api.quotes import quote_out
from app.api.schemas import (
    AdminBrandIn,
    AdminBrandOut,
    AdminCategoryIn,
    AdminCategoryOut,
    AdminCollectionIn,
    AdminCollectionOut,
    AdminOrderOut,
    AdminOrderStatusIn,
    AdminProductIn,
    AdminProductOut,
    AdminQuoteOut,
    AdminQuoteStatusIn,
)
from app.core.database import get_db
from app.core.media import build_media_url, ensure_media_dir
from app.models.catalog import Brand, Category, Product
from app.models.collections import Collection, CollectionProduct
from app.models.order import (
    ORDER_STATUS_PAID,
    PAYMENT_METHOD_WESTERN_UNION,
    PAYMENT_STATUS_PAID,
    Order,
    Payment,
)
from app.models.quote import QuoteRequest

router = APIRouter(
    prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _slugify(text: str) -> str:
    # Decompose accents so "Refractómetro" slugs as "refractometro".
    decomposed = unicodedata.normalize("NFKD", text.strip().lower())
    plain = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


async def _unique_slug(db: AsyncSession, model, name: str, exclude_id: int | None = None) -> str:
    base = _slugify(name) or "item"
    candidate = base
    suffix = 2
    while True:
        statement = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            statement = statement.where(model.id != exclude_id)
        if await db.scalar(statement) is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


async def _require_category(db: AsyncSession, category_id: int | None) -> None:
    if category_id is not None and await db.get(Category, category_id) is None:
        raise HTTPException(status_code=422, detail="Unknown category_id")


async def _require_brand(db: AsyncSession, brand_id: int | None) -> None:
    if brand_id is not None and await db.get(Brand, brand_id) is None:
        raise HTTPException(status_code=422, detail="Unknown brand_id")


def _certifications(raw: list[str]) -> list[str]:
    return list(dict.fromkeys(c.strip().upper() for c in raw if c.strip()))


def _product_out(product: Product, brand_name: str | None, category_name: str | None) -> AdminProductOut:
    # Rows seeded before the JSONB fix may hold an empty object instead of an
    # empty list; never crash the panel over legacy data.
    specifications = (
        product.specifications if isinstance(product.specifications, list) else []
    )
    return AdminProductOut(
        id=product.id,
        slug=product.slug,
        name=product.name,
        description=product.description,
        price_gs=product.price_gs,
        price_usd=f"{product.price_usd:.2f}",
        available=product.available,
        orderable=product.orderable,
        certifications=product.certifications,
        images=product.images,
        specifications=specifications,
        category_id=product.category_id,
        brand_id=product.brand_id,
        category_name=category_name,
        brand_name=brand_name,
        created_at=product.created_at,
    )


async def _apply_product(db: AsyncSession, product: Product, payload: AdminProductIn) -> None:
    await _require_category(db, payload.category_id)
    await _require_brand(db, payload.brand_id)
    product.name = payload.name.strip()
    product.description = payload.description.strip()
    product.price_gs = payload.price_gs
    product.price_usd = payload.price_usd
    product.available = payload.available
    product.orderable = payload.orderable
    product.certifications = _certifications(payload.certifications)
    product.images = payload.images
    product.specifications = [spec.model_dump() for spec in payload.specifications]
    product.category_id = payload.category_id
    product.brand_id = payload.brand_id


# --- Products ---


@router.get("/products", response_model=list[AdminProductOut])
async def list_products(db: AsyncSession = Depends(get_db)) -> list[AdminProductOut]:
    rows = (
        await db.execute(
            select(Product, Brand.name, Category.name)
            .join(Brand, Brand.id == Product.brand_id, isouter=True)
            .join(Category, Category.id == Product.category_id, isouter=True)
            .order_by(Product.created_at.desc())
        )
    ).all()
    return [_product_out(product, brand_name, category_name) for product, brand_name, category_name in rows]


@router.get("/products/{product_id}", response_model=AdminProductOut)
async def get_product(
    product_id: int, db: AsyncSession = Depends(get_db)
) -> AdminProductOut:
    row = (
        await db.execute(
            select(Product, Brand.name, Category.name)
            .join(Brand, Brand.id == Product.brand_id, isouter=True)
            .join(Category, Category.id == Product.category_id, isouter=True)
            .where(Product.id == product_id)
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product, brand_name, category_name = row
    return _product_out(product, brand_name, category_name)


@router.post("/products", response_model=AdminProductOut, status_code=201)
async def create_product(
    payload: AdminProductIn, db: AsyncSession = Depends(get_db)
) -> AdminProductOut:
    await _require_category(db, payload.category_id)
    await _require_brand(db, payload.brand_id)
    product = Product(slug=await _unique_slug(db, Product, payload.name))
    await _apply_product(db, product, payload)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return _product_out(product, None, None)


@router.put("/products/{product_id}", response_model=AdminProductOut)
async def update_product(
    product_id: int, payload: AdminProductIn, db: AsyncSession = Depends(get_db)
) -> AdminProductOut:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    await _apply_product(db, product, payload)
    await db.commit()
    await db.refresh(product)
    row = (
        await db.execute(
            select(Brand.name, Category.name)
            .join(Product, Product.brand_id == Brand.id, isouter=True)
            .join(Category, Category.id == Product.category_id, isouter=True)
            .where(Product.id == product_id)
        )
    ).first()
    return _product_out(product, row[0], row[1])


# --- Categories ---


@router.get("/categories", response_model=list[AdminCategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[AdminCategoryOut]:
    rows = (await db.execute(select(Category).order_by(Category.name))).scalars().all()
    return [
        AdminCategoryOut(id=category.id, slug=category.slug, name=category.name, parent_id=category.parent_id)
        for category in rows
    ]


@router.post("/categories", response_model=AdminCategoryOut, status_code=201)
async def create_category(
    payload: AdminCategoryIn, db: AsyncSession = Depends(get_db)
) -> AdminCategoryOut:
    if payload.parent_id is not None and await db.get(Category, payload.parent_id) is None:
        raise HTTPException(status_code=422, detail="Unknown parent_id")
    category = Category(
        name=payload.name.strip(),
        slug=await _unique_slug(db, Category, payload.name),
        parent_id=payload.parent_id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return AdminCategoryOut(id=category.id, slug=category.slug, name=category.name, parent_id=category.parent_id)


@router.put("/categories/{category_id}", response_model=AdminCategoryOut)
async def update_category(
    category_id: int, payload: AdminCategoryIn, db: AsyncSession = Depends(get_db)
) -> AdminCategoryOut:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if payload.parent_id is not None and await db.get(Category, payload.parent_id) is None:
        raise HTTPException(status_code=422, detail="Unknown parent_id")
    category.name = payload.name.strip()
    category.parent_id = payload.parent_id
    await db.commit()
    await db.refresh(category)
    return AdminCategoryOut(id=category.id, slug=category.slug, name=category.name, parent_id=category.parent_id)


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)) -> None:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(category)
    await db.commit()


# --- Brands ---


@router.get("/brands", response_model=list[AdminBrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)) -> list[AdminBrandOut]:
    rows = (await db.execute(select(Brand).order_by(Brand.name))).scalars().all()
    return [AdminBrandOut(id=brand.id, slug=brand.slug, name=brand.name) for brand in rows]


@router.post("/brands", response_model=AdminBrandOut, status_code=201)
async def create_brand(
    payload: AdminBrandIn, db: AsyncSession = Depends(get_db)
) -> AdminBrandOut:
    brand = Brand(name=payload.name.strip(), slug=await _unique_slug(db, Brand, payload.name))
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return AdminBrandOut(id=brand.id, slug=brand.slug, name=brand.name)


@router.put("/brands/{brand_id}", response_model=AdminBrandOut)
async def update_brand(
    brand_id: int, payload: AdminBrandIn, db: AsyncSession = Depends(get_db)
) -> AdminBrandOut:
    brand = await db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand.name = payload.name.strip()
    await db.commit()
    await db.refresh(brand)
    return AdminBrandOut(id=brand.id, slug=brand.slug, name=brand.name)


@router.delete("/brands/{brand_id}", status_code=204)
async def delete_brand(brand_id: int, db: AsyncSession = Depends(get_db)) -> None:
    brand = await db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    await db.delete(brand)
    await db.commit()


# --- Collections ---


@router.get("/collections", response_model=list[AdminCollectionOut])
async def list_collections(db: AsyncSession = Depends(get_db)) -> list[AdminCollectionOut]:
    collections = (await db.execute(select(Collection).order_by(Collection.type))).scalars().all()
    links = (
        await db.execute(select(CollectionProduct).order_by(CollectionProduct.position))
    ).scalars().all()
    grouped: dict[int, list[int]] = {}
    for link in links:
        grouped.setdefault(link.collection_id, []).append(link.product_id)
    return [
        AdminCollectionOut(type=collection.type, product_ids=grouped.get(collection.id, []))
        for collection in collections
    ]


@router.put("/collections/{collection_type}", response_model=AdminCollectionOut)
async def set_collection(
    collection_type: Literal["carousel", "popular", "promo"],
    payload: AdminCollectionIn,
    db: AsyncSession = Depends(get_db),
) -> AdminCollectionOut:
    known_ids = set((await db.execute(select(Product.id))).scalars().all())
    unknown = set(payload.product_ids) - known_ids
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown product ids: {sorted(unknown)}")
    product_ids = list(dict.fromkeys(payload.product_ids))
    collection = (
        await db.execute(select(Collection).where(Collection.type == collection_type))
    ).scalar_one_or_none()
    if collection is None:
        collection = Collection(type=collection_type)
        db.add(collection)
        await db.flush()
    await db.execute(
        delete(CollectionProduct).where(CollectionProduct.collection_id == collection.id)
    )
    for position, product_id in enumerate(product_ids):
        db.add(
            CollectionProduct(
                collection_id=collection.id, product_id=product_id, position=position
            )
        )
    await db.commit()
    return AdminCollectionOut(type=collection_type, product_ids=product_ids)


# --- Images ---


@router.post("/images", status_code=201)
async def upload_image(file: UploadFile = File(...)) -> dict:
    content_type = file.content_type or ""
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(
            status_code=422,
            detail="image must be JPEG, PNG, WebP or GIF",
        )
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=422, detail="image larger than 5MB")
    media_dir = ensure_media_dir()
    filename = f"{uuid4().hex}{extension}"
    (media_dir / filename).write_bytes(data)
    return {"url": build_media_url(filename)}


# --- Orders ---


async def admin_order_out(db: AsyncSession, order: Order) -> AdminOrderOut:
    """The storefront's order serialization plus the row id and the payment's
    own status (pending until confirmed — admin marking is #16)."""
    base = await order_out(db, order)
    payment = (
        (
            await db.execute(
                select(Payment).where(Payment.order_id == order.id).limit(1)
            )
        ).scalars()
    ).first()
    return AdminOrderOut(
        **base.model_dump(), id=order.id, payment_status=payment.status if payment else None
    )


@router.get("/orders", response_model=list[AdminOrderOut])
async def list_orders(db: AsyncSession = Depends(get_db)) -> list[AdminOrderOut]:
    orders = (
        (
            await db.execute(
                select(Order).order_by(Order.created_at.desc(), Order.id.desc())
            )
        ).scalars()
    ).all()
    return [await admin_order_out(db, order) for order in orders]


@router.patch("/orders/{order_id}", response_model=AdminOrderOut)
async def set_order_status(
    order_id: int, payload: AdminOrderStatusIn, db: AsyncSession = Depends(get_db)
) -> AdminOrderOut:
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    # Marking an order paid confirms its payment — but only for the manual
    # Western Union transfer: the gateway-backed methods are confirmed by
    # POST /api/payments/confirm, never by hand (docs/adr/0001-payments.md).
    if payload.status == ORDER_STATUS_PAID:
        payment = (
            (
                await db.execute(
                    select(Payment)
                    .where(Payment.order_id == order.id)
                    .order_by(Payment.id)
                    .limit(1)
                )
            ).scalars()
        ).first()
        if (
            payment is not None
            and payment.method == PAYMENT_METHOD_WESTERN_UNION
            and payment.status != PAYMENT_STATUS_PAID
        ):
            payment.status = PAYMENT_STATUS_PAID
    await db.commit()
    return await admin_order_out(db, order)


# --- Quotes ---


@router.get("/quotes", response_model=list[AdminQuoteOut])
async def list_quotes(db: AsyncSession = Depends(get_db)) -> list[AdminQuoteOut]:
    quotes = (
        (
            await db.execute(
                select(QuoteRequest).order_by(
                    QuoteRequest.created_at.desc(), QuoteRequest.id.desc()
                )
            )
        ).scalars()
    ).all()
    return [
        AdminQuoteOut(**quote_out(quote).model_dump(), id=quote.id) for quote in quotes
    ]


@router.patch("/quotes/{quote_id}", response_model=AdminQuoteOut)
async def set_quote_status(
    quote_id: int, payload: AdminQuoteStatusIn, db: AsyncSession = Depends(get_db)
) -> AdminQuoteOut:
    quote = await db.get(QuoteRequest, quote_id)
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote request not found")
    quote.status = payload.status
    await db.commit()
    return AdminQuoteOut(**quote_out(quote).model_dump(), id=quote.id)
