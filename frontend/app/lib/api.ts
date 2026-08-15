import { headers } from "next/headers";

export type Facet = {
  slug: string;
  name: string;
};

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  price_gs: number;
  price_usd: string;
  image: string | null;
  available: boolean;
  orderable: boolean;
  certifications: string[];
  brand: string | null;
  category: string | null;
};

export type ProductPage = {
  items: ProductCard[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
  categories: Facet[];
  brands: Facet[];
};

export type Specification = {
  key: string;
  value: string;
};

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_gs: number;
  price_usd: string;
  images: string[];
  specifications: Specification[];
  available: boolean;
  orderable: boolean;
  certifications: string[];
  brand: string | null;
  category: string | null;
};

export type Currency = import("./currency").Currency;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Visitor currency, resolved from the incoming request's IP. Server-only:
 * next/headers is imported above, so client components must not import this
 * module at runtime (type-only imports are fine).
 */
export async function fetchVisitorCurrency(): Promise<Currency> {
  return fetchCurrency(headers().get("x-forwarded-for"));
}

export async function fetchProducts(params: URLSearchParams): Promise<ProductPage> {
  const response = await fetch(`${BACKEND_URL}/api/products?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Products request failed: ${response.status}`);
  }
  return (await response.json()) as ProductPage;
}

export async function fetchProduct(slug: string): Promise<ProductDetail> {
  const response = await fetch(`${BACKEND_URL}/api/products/${slug}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Product request failed: ${response.status}`);
  }
  return (await response.json()) as ProductDetail;
}

export async function fetchCurrency(forwardedFor?: string | null): Promise<Currency> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/geo/currency`, {
      cache: "no-store",
      headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined,
    });
    if (!response.ok) {
      return "USD";
    }
    return ((await response.json()) as { currency: Currency }).currency;
  } catch {
    return "USD";
  }
}

export async function fetchCategories(): Promise<Facet[]> {
  const response = await fetch(`${BACKEND_URL}/api/categories`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Categories request failed: ${response.status}`);
  }
  return (await response.json()) as Facet[];
}

export async function fetchBrands(): Promise<Facet[]> {
  const response = await fetch(`${BACKEND_URL}/api/brands`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Brands request failed: ${response.status}`);
  }
  return (await response.json()) as Facet[];
}

export function formatBrandCategory(brand: string | null, category: string | null): string {
  return [brand, category].filter(Boolean).join(" · ");
}
