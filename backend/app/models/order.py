"""Order: a buyer's completed purchase, created at checkout from a Cart.

Checkout snapshots product name, image, and price onto OrderItem rows so the
order history stays intact even if the catalog changes later. Status starts at
`received`; ticket #12 (Payments) extends the vocabulary from there.
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

# Order status: `received` is the only status reachable today. Payments (#12)
# and fulfilment add `awaiting_payment`, `paid`, `shipped`, `delivered`, ...
ORDER_STATUS_RECEIVED = "received"

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
    delivery_type: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120))
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    country: Mapped[str] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ORDER_STATUS_RECEIVED)
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
