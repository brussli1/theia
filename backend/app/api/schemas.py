from pydantic import BaseModel


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
