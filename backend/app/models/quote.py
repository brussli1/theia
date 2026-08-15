"""QuoteRequest: a customer's request for pricing (ticket #13).

Unifies the three contact paths of the PRD — quote-only product, used
equipment, rental — into one flow. The request is stored so Theia can follow
up (admin #16 extends the status vocabulary from `new`); the product name is
snapshotted like OrderItem so history survives catalog changes. Notification
to Theia (WhatsApp + email) is a separate seam (app/notifications) that runs
after the request is persisted.
"""

import secrets
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.catalog import Product

# What the customer is asking a quote for.
QUOTE_KIND_PRODUCT = "product"
QUOTE_KIND_USED = "used"
QUOTE_KIND_RENTAL = "rental"
QUOTE_KINDS = frozenset({QUOTE_KIND_PRODUCT, QUOTE_KIND_USED, QUOTE_KIND_RENTAL})

# Quote status: every new request starts `new`; responding and closing are
# admin territory (#16).
QUOTE_STATUS_NEW = "new"

_QUOTE_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_quote_reference() -> str:
    """Human-friendly quote reference, e.g. QT-8F3K9Q2M, like order numbers."""
    return "QT-" + "".join(secrets.choice(_QUOTE_REFERENCE_ALPHABET) for _ in range(8))


class QuoteRequest(Base):
    __tablename__ = "quote_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    kind: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(40))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default=QUOTE_STATUS_NEW,
        server_default=QUOTE_STATUS_NEW,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    product: Mapped["Product | None"] = relationship()
