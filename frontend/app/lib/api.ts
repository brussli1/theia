import { headers } from "next/headers";
import { accountAuthorizationHeader } from "./backend";

export type Facet = {
  slug: string;
  name: string;
};

export type CategoryFacet = Facet & {
  id: number;
  parent_id: number | null;
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
  /** Sanitized structured description fragment (server-side allowlist); empty
   * for admin-created products, which render the plain `description`. */
  description_html: string;
  price_gs: number;
  price_usd: string;
  images: string[];
  /** Per-image alt text aligned with `images`; index 0 is the hero. */
  image_alt: string[];
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

export async function fetchCategories(): Promise<CategoryFacet[]> {
  const response = await fetch(`${BACKEND_URL}/api/categories`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Categories request failed: ${response.status}`);
  }
  return (await response.json()) as CategoryFacet[];
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
 * `paid` once the payment is confirmed — by the gateway, or by an admin for
 * Western Union (#16). Fulfilment (admin) then moves them through `shipped`
 * and `delivered`. `received` is the legacy status of orders created before
 * payments existed. */
export const ORDER_STATUS_AWAITING_PAYMENT = "awaiting_payment";
export const ORDER_STATUS_PAID = "paid";
export const ORDER_STATUS_SHIPPED = "shipped";
export const ORDER_STATUS_DELIVERED = "delivered";
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

/** Quote statuses (#13/#16): every request starts `new`; an admin marks it
 * `responded` once the customer has been answered and `closed` when the
 * conversation is over. */
export const QUOTE_STATUS_NEW = "new";
export const QUOTE_STATUS_RESPONDED = "responded";
export const QUOTE_STATUS_CLOSED = "closed";

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

/** A customer's registered identity (#14); used to see order and quote
 * history. The session token lives in the `auth_token` cookie. `role` is
 * `admin` for accounts that may use the admin panel (#15). */
export type User = {
  id: number;
  email: string;
  name: string;
  role: "customer" | "admin";
};

/** The signed-in customer from the incoming request's cookie, or null when
 * there is no session. Server-only. */
export async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    cache: "no-store",
    headers: { authorization: accountAuthorizationHeader() },
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Auth request failed: ${response.status}`);
  }
  return (await response.json()) as User;
}

/** The signed-in customer's orders, newest first (#14). Server-only. */
export async function fetchAccountOrders(): Promise<Order[]> {
  const response = await fetch(`${BACKEND_URL}/api/account/orders`, {
    cache: "no-store",
    headers: { authorization: accountAuthorizationHeader() },
  });
  if (!response.ok) {
    throw new Error(`Account orders request failed: ${response.status}`);
  }
  return (await response.json()) as Order[];
}

/** The signed-in customer's quote requests, newest first (#14). Server-only. */
export async function fetchAccountQuotes(): Promise<Quote[]> {
  const response = await fetch(`${BACKEND_URL}/api/account/quotes`, {
    cache: "no-store",
    headers: { authorization: accountAuthorizationHeader() },
  });
  if (!response.ok) {
    throw new Error(`Account quotes request failed: ${response.status}`);
  }
  return (await response.json()) as Quote[];
}

// --- Admin panel (#15) ------------------------------------------------------
// The panel's reads are server components too; the mutations are server
// actions in lib/admin-actions.ts. Both translate the `auth_token` cookie.

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_gs: number;
  price_usd: string;
  available: boolean;
  orderable: boolean;
  certifications: string[];
  images: string[];
  specifications: Specification[];
  category_id: number | null;
  brand_id: number | null;
  category_name: string | null;
  brand_name: string | null;
  created_at: string;
};

export type AdminCategory = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
};

export type AdminBrand = {
  id: number;
  slug: string;
  name: string;
};

export type AdminCollection = {
  type: string;
  product_ids: number[];
};

/** The admin's view of an order (#16): everything the storefront shows plus
 * the row id and the payment's own status (pending until confirmed — the
 * Western Union gap #12 left open for admin handling). */
export type AdminOrder = Order & {
  id: number;
  payment_status: string | null;
};

/** The admin's view of a quote request (#16): the storefront shape plus id. */
export type AdminQuote = Quote & {
  id: number;
};

async function adminFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    cache: "no-store",
    headers: { authorization: accountAuthorizationHeader() },
  });
  if (!response.ok) {
    throw new Error(`Admin request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  return adminFetch<AdminProduct[]>("/api/admin/products");
}

export async function fetchAdminProduct(id: number): Promise<AdminProduct> {
  return adminFetch<AdminProduct>(`/api/admin/products/${id}`);
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  return adminFetch<AdminCategory[]>("/api/admin/categories");
}

export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  return adminFetch<AdminBrand[]>("/api/admin/brands");
}

export async function fetchAdminCollections(): Promise<AdminCollection[]> {
  return adminFetch<AdminCollection[]>("/api/admin/collections");
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  return adminFetch<AdminOrder[]>("/api/admin/orders");
}

export async function fetchAdminQuotes(): Promise<AdminQuote[]> {
  return adminFetch<AdminQuote[]>("/api/admin/quotes");
}
