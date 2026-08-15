"""Order and Payment: a buyer's completed purchase, created at checkout.

Checkout snapshots product name, image, and price onto OrderItem rows so the
order history stays intact even if the catalog changes later. Every order
records a payment method; new orders start `awaiting_payment` and move to
`paid` once the payment is confirmed. Fulfilment (admin) extends the status
vocabulary from there.
"""

import secrets
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.catalog import Product
    from app.models.user import User

# Order status: every new order starts `awaiting_payment` and moves to `paid`
# when the gateway confirms the payment. Fulfilment (admin) adds `shipped`,
# `delivered`, ... `received` is a legacy status kept for orders created
# before payments existed, when payment was arranged by hand.
ORDER_STATUS_AWAITING_PAYMENT = "awaiting_payment"
ORDER_STATUS_PAID = "paid"
ORDER_STATUS_RECEIVED = "received"

# Payment methods offered at checkout.
PAYMENT_METHOD_PAYPAL = "paypal"
PAYMENT_METHOD_WESTERN_UNION = "western_union"
PAYMENT_METHOD_CARD = "card"

# Charge currency per method, driven by what each gateway actually supports:
# Bancard vPOS (cards) settles PYG only, and PayPal REST cannot charge PYG, so
# PayPal charges the order's USD snapshot instead. Western Union is manual and
# quoted in Gs, matching the local account. See docs/adr/0001-payments.md.
GATEWAY_METHODS = frozenset({PAYMENT_METHOD_PAYPAL, PAYMENT_METHOD_CARD})
PAYMENT_CURRENCIES = {
    PAYMENT_METHOD_PAYPAL: "USD",
    PAYMENT_METHOD_WESTERN_UNION: "PYG",
    PAYMENT_METHOD_CARD: "PYG",
}

# Payment status: `pending` until the payment is confirmed, then `paid`.
PAYMENT_STATUS_PENDING = "pending"
PAYMENT_STATUS_PAID = "paid"

# Delivery: local (Paraguay) or international (abroad).
DELIVERY_LOCAL = "local"
DELIVERY_INTERNATIONAL = "international"

_ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_order_number() -> str:
    """Human-friendly order number, e.g. TH-8F3K9Q2M. High entropy and free of
    ambiguous characters; used on the public order lookup page."""
    return "TH-" + "".join(secrets.choice(_ORDER_NUMBER_ALPHABET) for _ in range(8))


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(40))
    # The account that placed the order, when the customer was logged in
    # (#14); guest orders have none.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    delivery_type: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120))
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    country: Mapped[str] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default=ORDER_STATUS_AWAITING_PAYMENT,
        server_default=ORDER_STATUS_AWAITING_PAYMENT,
    )
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    subtotal_gs: Mapped[int] = mapped_column()
    subtotal_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    user: Mapped["User | None"] = relationship()


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(300))
    image: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_gs: Mapped[int] = mapped_column()
    price_usd: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship()


class Payment(Base):
    """A payment recorded against an Order, with a status of its own.

    One order carries one payment today. `shop_process_id` is our own
    reference — the order number — and doubles as the merchant id gateways
    require (Bancard vPOS marketplace id). `gateway_reference` is the
    gateway-side id of the charge (Bancard process_id, PayPal order id);
    Western Union payments have none. `amount`/`currency` snapshot what was
    charged at the gateway (currency is configurable, PYG by default).
    """

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    method: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default=PAYMENT_STATUS_PENDING)
    shop_process_id: Mapped[str] = mapped_column(String(20), unique=True)
    gateway_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    order: Mapped["Order"] = relationship(back_populates="payments")
