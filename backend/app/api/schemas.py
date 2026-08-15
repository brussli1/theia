from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# Customer contact email, used by checkout and quote requests alike.
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


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


class CheckoutIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    phone: str = Field(min_length=1, max_length=40)
    delivery_type: Literal["local", "international"]
    payment_method: Literal["paypal", "western_union", "card"]
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=300)
    city: str = Field(min_length=1, max_length=120)
    region: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=30)
    country: str = Field(min_length=1, max_length=120)
    notes: str | None = Field(default=None, max_length=2000)


class OrderItemOut(BaseModel):
    product_name: str
    image: str | None
    price_gs: int
    price_usd: str
    quantity: int


class OrderOut(BaseModel):
    order_number: str
    status: str
    payment_method: str | None
    payment_currency: str | None
    email: str
    phone: str
    delivery_type: Literal["local", "international"]
    name: str
    address: str
    city: str
    region: str | None
    postal_code: str | None
    country: str
    notes: str | None
    subtotal_gs: int
    subtotal_usd: str
    items: list[OrderItemOut]
    created_at: datetime


class CheckoutOut(OrderOut):
    """The checkout response: the new order plus, for gateway methods, the URL
    the customer's browser must be sent to in order to pay."""

    payment_redirect_url: str | None = None


class ConfirmIn(BaseModel):
    order_number: str = Field(min_length=1, max_length=20)
    payment_ref: str = Field(min_length=1, max_length=120)


class QuoteIn(BaseModel):
    kind: Literal["product", "used", "rental"]
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    phone: str = Field(min_length=1, max_length=40)
    message: str | None = Field(default=None, max_length=2000)
    product_slug: str | None = Field(default=None, max_length=300)


class QuoteOut(BaseModel):
    reference: str
    kind: str
    product_name: str | None
    name: str
    email: str
    phone: str
    message: str | None
    status: str
    created_at: datetime


class UserOut(BaseModel):
    id: int
    email: str
    name: str


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class AuthOut(BaseModel):
    """The session token plus the account it belongs to; register and login
    both return one so the browser can store it and the account is
    immediately signed in."""

    token: str
    user: UserOut
