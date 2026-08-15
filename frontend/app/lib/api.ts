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

export type CartItem = {
  id: number;
  slug: string;
  name: string;
  price_gs: number;
  price_usd: string;
  image: string | null;
  quantity: number;
};

export type Cart = {
  cart_id: string;
  total_items: number;
  items: CartItem[];
};

/** Visitor cart, forwarded from the incoming request's cookie. Server-only. */
export async function fetchCart(): Promise<Cart> {
  const response = await fetch(`${BACKEND_URL}/api/cart`, {
    cache: "no-store",
    headers: { cookie: headers().get("cookie") ?? "" },
  });
  if (!response.ok) {
    throw new Error(`Cart request failed: ${response.status}`);
  }
  return (await response.json()) as Cart;
}

export async function fetchBrands(): Promise<Facet[]> {
  const response = await fetch(`${BACKEND_URL}/api/brands`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Brands request failed: ${response.status}`);
  }
  return (await response.json()) as Facet[];
}

export type OrderItem = {
  product_name: string;
  image: string | null;
  price_gs: number;
  price_usd: string;
  quantity: number;
};

/** Order statuses (#12): new orders wait for their payment, then move to
 * `paid` once the gateway confirms it. `received` is the legacy status of
 * orders created before payments existed. */
export const ORDER_STATUS_AWAITING_PAYMENT = "awaiting_payment";
export const ORDER_STATUS_PAID = "paid";
export const ORDER_STATUS_RECEIVED = "received";

export type Order = {
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_currency: string | null;
  email: string;
  phone: string;
  delivery_type: "local" | "international";
  name: string;
  address: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  country: string;
  notes: string | null;
  subtotal_gs: number;
  subtotal_usd: string;
  items: OrderItem[];
  created_at: string;
};

/** Order lookup for the confirmation/tracking page. Server-only. */
export async function fetchOrder(orderNumber: string, email: string): Promise<Order> {
  const params = new URLSearchParams({ email });
  const response = await fetch(
    `${BACKEND_URL}/api/orders/${encodeURIComponent(orderNumber)}?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Order request failed: ${response.status}`);
  }
  return (await response.json()) as Order;
}

/** Confirms a gateway payment on the customer's return from the payment page and
 * returns the order with its fresh status. Server-only; idempotent. */
export async function confirmPayment(
  orderNumber: string,
  paymentRef: string,
): Promise<Order> {
  const response = await fetch(`${BACKEND_URL}/api/payments/confirm`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order_number: orderNumber, payment_ref: paymentRef }),
  });
  if (!response.ok) {
    throw new Error(`Payment confirm failed: ${response.status}`);
  }
  return (await response.json()) as Order;
}

export type Collection = {
  type: string;
  products: ProductCard[];
};

export const COLLECTION_TYPES = ["carousel", "popular", "promo"] as const;

export async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${BACKEND_URL}/api/collections`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Collections request failed: ${response.status}`);
  }
  return (await response.json()) as Collection[];
}

/** Quote request kinds (#13): the PRD's three contact paths share one flow. */
export const QUOTE_KIND_PRODUCT = "product";
export const QUOTE_KIND_USED = "used";
export const QUOTE_KIND_RENTAL = "rental";

export type Quote = {
  reference: string;
  kind: string;
  product_name: string | null;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
  created_at: string;
};

/** Quote lookup for the confirmation page, mirroring order lookup. Server-only. */
export async function fetchQuote(reference: string, email: string): Promise<Quote> {
  const params = new URLSearchParams({ email });
  const response = await fetch(
    `${BACKEND_URL}/api/quotes/${encodeURIComponent(reference)}?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Quote request failed: ${response.status}`);
  }
  return (await response.json()) as Quote;
}

export function formatBrandCategory(brand: string | null, category: string | null): string {
  return [brand, category].filter(Boolean).join(" · ");
}
