"""Anonymous cart: persists for a guest session via a `cart_id` cookie.

Only Orderable products may be added; Quote-only products are rejected with
409. The cart id travels in the request cookie; the frontend mirrors it into
its own `cart_id` cookie via the response body, since server-side fetches do
not surface Set-Cookie headers to the browser.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import AddItemIn, CartItemOut, CartOut, UpdateItemIn
from app.core.database import get_db
from app.models.cart import Cart, CartItem
from app.models.catalog import Product

router = APIRouter(prefix="/api/cart", tags=["cart"])

CART_COOKIE = "cart_id"
CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days, matches a guest session


def _cart_id(request: Request) -> uuid.UUID | None:
    raw = request.cookies.get(CART_COOKIE)
    if not raw:
        return None
    try:
        return uuid.UUID(raw)
    except ValueError:
        return None


def _set_cart_cookie(response: Response, cart_id: uuid.UUID) -> None:
    response.set_cookie(
        CART_COOKIE,
        str(cart_id),
        max_age=CART_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        path="/",
    )


@router.post("", response_model=CartOut, status_code=201)
async def create_cart(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> CartOut:
    existing = _cart_id(request)
    if existing is not None:
        cart = await db.get(Cart, existing)
        if cart is not None:
            return await _cart_out(cart, await _cart_items(db, cart.id))

    cart = Cart()
    db.add(cart)
    await db.commit()
    _set_cart_cookie(response, cart.id)
    return CartOut(cart_id=str(cart.id), total_items=0, items=[])


@router.get("", response_model=CartOut)
async def get_cart(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CartOut:
    cart_id = _cart_id(request)
    if cart_id is None:
        return CartOut(cart_id="", total_items=0, items=[])
    cart = await db.get(Cart, cart_id)
    if cart is None:
        return CartOut(cart_id="", total_items=0, items=[])
    return await _cart_out(cart, await _cart_items(db, cart.id))


@router.post("/items", response_model=CartOut, status_code=201)
async def add_item(
    payload: AddItemIn,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> CartOut:
    product = (
        await db.execute(select(Product).where(Product.slug == payload.product_slug))
    ).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.orderable:
        raise HTTPException(
            status_code=409, detail="Quote-only products cannot be added to the cart"
        )

    cart_id = _cart_id(request)
    cart = await db.get(Cart, cart_id) if cart_id is not None else None
    if cart is None:
        cart = Cart()
        db.add(cart)
        await db.flush()
        _set_cart_cookie(response, cart.id)

    item = (
        await db.execute(
            select(CartItem).where(
                CartItem.cart_id == cart.id, CartItem.product_id == product.id
            )
        )
    ).scalar_one_or_none()
    if item is None:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=payload.quantity,
            )
        )
    else:
        item.quantity += payload.quantity

    await db.commit()
    return await _cart_out(cart, await _cart_items(db, cart.id))


async def _get_cart_item(db: AsyncSession, cart_id: uuid.UUID, item_id: int) -> CartItem:
    item = await db.get(CartItem, item_id)
    if item is None or item.cart_id != cart_id:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/items/{item_id}", response_model=CartOut)
async def update_item(
    item_id: int,
    payload: UpdateItemIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CartOut:
    cart_id = _cart_id(request)
    if cart_id is None:
        raise HTTPException(status_code=404, detail="No cart")
    item = await _get_cart_item(db, cart_id, item_id)

    item.quantity = payload.quantity
    await db.commit()
    cart = await db.get(Cart, cart_id)
    return await _cart_out(cart, await _cart_items(db, cart.id))


@router.delete("/items/{item_id}", status_code=204)
async def remove_item(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Response:
    cart_id = _cart_id(request)
    if cart_id is None:
        raise HTTPException(status_code=404, detail="No cart")
    item = await _get_cart_item(db, cart_id, item_id)

    await db.delete(item)
    await db.commit()
    return Response(status_code=204)


async def _cart_items(db: AsyncSession, cart_id: uuid.UUID) -> list[tuple[CartItem, Product]]:
    return (
        (
            await db.execute(
                select(CartItem, Product)
                .join(Product, Product.id == CartItem.product_id)
                .where(CartItem.cart_id == cart_id)
                .order_by(CartItem.id)
            )
        ).all()
    )


async def _cart_out(cart: Cart, rows: list[tuple[CartItem, Product]]) -> CartOut:
    items = [
        CartItemOut(
            id=item.id,
            slug=product.slug,
            name=product.name,
            price_gs=product.price_gs,
            price_usd=f"{product.price_usd:.2f}",
            image=product.images[0] if product.images else None,
            quantity=item.quantity,
        )
        for item, product in rows
    ]
    return CartOut(
        cart_id=str(cart.id),
        total_items=sum(item.quantity for item, _ in rows),
        items=items,
    )
