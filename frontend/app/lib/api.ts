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

export function formatGs(priceGs: number): string {
  return `Gs ${priceGs.toLocaleString("es-PY")}`;
}

export function formatUsd(priceUsd: string): string {
  return `US$ ${Number(priceUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}
