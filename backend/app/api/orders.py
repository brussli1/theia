"""Orders: guest checkout and order lookup.

Checkout converts the visitor's Cart (from the `cart_id` cookie) into an
Order, snapshotting product names and prices, then deletes the cart. Every
order records a payment method (#12): Western Union orders wait for a manual
transfer; PayPal and card orders get a payment intent from a swappable
gateway provider before the order is persisted, and are confirmed via
`POST /api/payments/confirm`. Orders are looked up by order number plus the
email used at checkout, and are attached to the customer's account when they
are signed in (#14); `GET /api/account/orders` lists an account's orders.
"""

from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_optional_current_user
from app.api.cart import _cart_id
from app.api.schemas import CheckoutIn, CheckoutOut, OrderItemOut, OrderOut
from app.core.config import settings
from app.core.database import get_db
from app.models.cart import Cart, CartItem
from app.models.catalog import Product
from app.models.order import (
    GATEWAY_METHODS,
    ORDER_STATUS_AWAITING_PAYMENT,
    PAYMENT_CURRENCIES,
    PAYMENT_STATUS_PENDING,
    Order,
    OrderItem,
    Payment,
    new_order_number,
)
from app.models.user import User
from app.payments.base import PaymentProviderError
from app.payments.registry import get_provider

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _charge_amount(
    amount_gs: int, amount_usd: Decimal, method: str
) -> tuple[Decimal, str]:
    """The amount charged at the gateway, in the method's charge currency
    (see PAYMENT_CURRENCIES in models/order.py)."""
    currency = PAYMENT_CURRENCIES[method]
    if currency == "USD":
        return amount_usd, currency
    return Decimal(amount_gs), "PYG"


@router.post("", response_model=CheckoutOut, status_code=201)
async def checkout(
    payload: CheckoutIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> CheckoutOut:
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

    # Gateway methods create the payment intent before anything is persisted:
    # if the gateway is unreachable the cart survives and the customer can
    # retry or pick another method. The order number doubles as the charge's
    # merchant reference (shop_process_id). Note: if the concurrency gate
    # below loses the race, the created intent is orphaned (no order row);
    # rolling gateway charges back is out of scope until a fulfilment flow
    # exists (see docs/adr/0001-payments.md).
    order_number = new_order_number()
    amount, currency = _charge_amount(subtotal_gs, subtotal_usd, payload.payment_method)
    intent = None
    if payload.payment_method in GATEWAY_METHODS:
        return_url = (
            f"{settings.frontend_url}/pedido/{order_number}"
            f"?email={quote(payload.email)}&payment_ref={order_number}"
        )
        cancel_url = f"{settings.frontend_url}/pedido/{order_number}?email={quote(payload.email)}"
        try:
            provider = get_provider(payload.payment_method)
            intent = provider.create_payment(
                shop_process_id=order_number,
                amount=amount,
                currency=currency,
                description=order_number,
                return_url=return_url,
                cancel_url=cancel_url,
            )
        except PaymentProviderError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error

    # Deleting the items first is the concurrency gate: two simultaneous
    # checkouts of the same cart both read the rows above, but only the first
    # DELETE affects rows — the loser sees 0 and gives up without an order.
    result = await db.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
    if result.rowcount == 0:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    order = Order(
        order_number=order_number,
        email=payload.email,
        phone=payload.phone,
        user_id=current_user.id if current_user else None,
        delivery_type=payload.delivery_type,
        name=payload.name,
        address=payload.address,
        city=payload.city,
        region=payload.region,
        postal_code=payload.postal_code,
        country=payload.country,
        notes=payload.notes,
        status=ORDER_STATUS_AWAITING_PAYMENT,
        payment_method=payload.payment_method,
        subtotal_gs=subtotal_gs,
        subtotal_usd=subtotal_usd,
        payments=[
            Payment(
                method=payload.payment_method,
                status=PAYMENT_STATUS_PENDING,
                shop_process_id=order_number,
                gateway_reference=intent.reference if intent else None,
                amount=amount,
                currency=currency,
            )
        ],
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
    out = await order_out(db, order)
    return CheckoutOut(
        **out.model_dump(),
        payment_redirect_url=intent.redirect_url if intent else None,
    )


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
    return await order_out(db, order)


async def order_out(db: AsyncSession, order: Order) -> OrderOut:
    items = (
        (
            await db.execute(
                select(OrderItem)
                .where(OrderItem.order_id == order.id)
                .order_by(OrderItem.id)
            )
        ).scalars()
    ).all()
    payment = (
        (
            await db.execute(
                select(Payment).where(Payment.order_id == order.id).limit(1)
            )
        ).scalars()
    ).first()
    return OrderOut(
        order_number=order.order_number,
        status=order.status,
        payment_method=order.payment_method,
        payment_currency=payment.currency if payment else None,
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
