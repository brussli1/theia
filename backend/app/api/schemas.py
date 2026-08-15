from typing import Literal

from pydantic import BaseModel, Field


class ProductCard(BaseModel):
    id: int
    slug: str
    name: str
    price_gs: int
    price_usd: str
    image: str | None
    available: bool
    orderable: bool
    certifications: list[str]
    brand: str | None
    category: str | None


class Specification(BaseModel):
    key: str
    value: str


class ProductDetail(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    price_gs: int
    price_usd: str
    images: list[str]
    specifications: list[Specification]
    available: bool
    orderable: bool
    certifications: list[str]
    brand: str | None
    category: str | None


class Facet(BaseModel):
    slug: str
    name: str


class ProductPage(BaseModel):
    items: list[ProductCard]
    page: int
    page_size: int
    total: int
    pages: int
    categories: list[Facet]
    brands: list[Facet]


class CartItemOut(BaseModel):
    id: int
    slug: str
    name: str
    price_gs: int
    price_usd: str
    image: str | None
    quantity: int


class CartOut(BaseModel):
    cart_id: str
    total_items: int
    items: list[CartItemOut]


class AddItemIn(BaseModel):
    product_slug: str
    quantity: int = Field(1, ge=1)


class UpdateItemIn(BaseModel):
    quantity: int = Field(ge=1)


class CollectionOut(BaseModel):
    type: Literal["carousel", "popular", "promo"]
    products: list[ProductCard]
