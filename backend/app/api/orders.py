"""Orders: guest checkout and order lookup.

Checkout converts the visitor's Cart (from the `cart_id` cookie) into an
Order, snapshotting product names and prices, then deletes the cart. Orders
are looked up by order number plus the email used at checkout. Ticket #12
adds payment methods; #14 adds account order history.
"""

from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.cart import _cart_id
from app.api.schemas import CheckoutIn, OrderItemOut, OrderOut
from app.core.database import get_db
from app.models.cart import Cart, CartItem
from app.models.catalog import Product
from app.models.order import Order, OrderItem, new_order_number

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=201)
async def checkout(
    payload: CheckoutIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    cart_id = _cart_id(request)
    cart = await db.get(Cart, cart_id) if cart_id is not None else None
    if cart is None:
        raise HTTPException(status_code=400, detail="Your cart is empty")
    rows = (
        (
            await db.execute(
                select(CartItem, Product)
                .join(Product, Product.id == CartItem.product_id)
                .where(CartItem.cart_id == cart.id)
                .order_by(CartItem.id)
            )
        ).all()
    )
    if not rows:
        raise HTTPException(status_code=400, detail="Your cart is empty")
    if any(not product.orderable or not product.available for _, product in rows):
        raise HTTPException(
            status_code=409,
            detail="One or more products in your cart are no longer available for purchase",
        )

    subtotal_gs = sum(item.quantity * product.price_gs for item, product in rows)
    subtotal_usd = sum(
        (item.quantity * product.price_usd for item, product in rows), Decimal("0")
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Deleting the items first is the concurrency gate: two simultaneous
    # checkouts of the same cart both read the rows above, but only the first
    # DELETE affects rows — the loser sees 0 and gives up without an order.
    result = await db.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
    if result.rowcount == 0:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    order = Order(
        order_number=new_order_number(),
        email=payload.email,
        phone=payload.phone,
        delivery_type=payload.delivery_type,
        name=payload.name,
        address=payload.address,
        city=payload.city,
        region=payload.region,
        postal_code=payload.postal_code,
        country=payload.country,
        notes=payload.notes,
        subtotal_gs=subtotal_gs,
        subtotal_usd=subtotal_usd,
        items=[
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                image=product.images[0] if product.images else None,
                price_gs=product.price_gs,
                price_usd=product.price_usd,
                quantity=item.quantity,
            )
            for item, product in rows
        ],
    )
    db.add(order)
    await db.delete(cart)
    await db.commit()
    return await _order_out(db, order)


@router.get("/{order_number}", response_model=OrderOut)
async def get_order(
    order_number: str,
    email: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
) -> OrderOut:
    order = (
        await db.execute(
            select(Order).where(
                Order.order_number == order_number.upper(),
                func.lower(Order.email) == email.lower(),
            )
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return await _order_out(db, order)


async def _order_out(db: AsyncSession, order: Order) -> OrderOut:
    items = (
        (
            await db.execute(
                select(OrderItem)
                .where(OrderItem.order_id == order.id)
                .order_by(OrderItem.id)
            )
        ).scalars()
    ).all()
    return OrderOut(
        order_number=order.order_number,
        status=order.status,
        email=order.email,
        phone=order.phone,
        delivery_type=order.delivery_type,
        name=order.name,
        address=order.address,
        city=order.city,
        region=order.region,
        postal_code=order.postal_code,
        country=order.country,
        notes=order.notes,
        subtotal_gs=order.subtotal_gs,
        subtotal_usd=f"{order.subtotal_usd:.2f}",
        items=[
            OrderItemOut(
                product_name=item.product_name,
                image=item.image,
                price_gs=item.price_gs,
                price_usd=f"{item.price_usd:.2f}",
                quantity=item.quantity,
            )
            for item in items
        ],
        created_at=order.created_at,
    )
