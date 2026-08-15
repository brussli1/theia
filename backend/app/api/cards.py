"""Shared mapping from a Product row to its public card shape."""

from app.api.schemas import ProductCard
from app.models.catalog import Product


def product_card(
    product: Product, brand_name: str | None, category_name: str | None
) -> ProductCard:
    return ProductCard(
        id=product.id,
        slug=product.slug,
        name=product.name,
        price_gs=product.price_gs,
        price_usd=f"{product.price_usd:.2f}",
        image=product.images[0] if product.images else None,
        available=product.available,
        orderable=product.orderable,
        certifications=product.certifications,
        brand=brand_name,
        category=category_name,
    )
