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

export type Currency = "PYG" | "USD";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

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

export async function fetchCurrency(): Promise<Currency> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/geo/currency`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return "USD";
    }
    return ((await response.json()) as { currency: Currency }).currency;
  } catch {
    return "USD";
  }
}

export function formatGs(priceGs: number): string {
  return `Gs ${priceGs.toLocaleString("es-PY")}`;
}

export function formatUsd(priceUsd: string): string {
  return `US$ ${Number(priceUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function formatPrice(
  priceGs: number,
  priceUsd: string,
  currency: Currency,
): string {
  return currency === "PYG" ? formatGs(priceGs) : formatUsd(priceUsd);
}

export function formatBrandCategory(brand: string | null, category: string | null): string {
  return [brand, category].filter(Boolean).join(" · ");
}
