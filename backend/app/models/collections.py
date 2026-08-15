"""Homepage Collections: admin-curated, ordered product lists.

One Collection per type (`popular` | `promo` | `carousel`); "Lo Nuevo" is
derived from the newest Products, never stored as a Collection.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, PrimaryKeyConstraint, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.catalog import Product


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    product_links: Mapped[list["CollectionProduct"]] = relationship(
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="CollectionProduct.position",
    )


class CollectionProduct(Base):
    __tablename__ = "collection_products"
    __table_args__ = (PrimaryKeyConstraint("collection_id", "product_id"),)

    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE")
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE")
    )
    position: Mapped[int] = mapped_column(default=0)

    collection: Mapped["Collection"] = relationship(back_populates="product_links")
    product: Mapped["Product"] = relationship()
