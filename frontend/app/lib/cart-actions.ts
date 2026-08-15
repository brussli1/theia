"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { BACKEND_URL, CART_COOKIE } from "./backend";

const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
} as const;

async function ensureCartId(): Promise<string> {
  const existing = cookies().get(CART_COOKIE)?.value;
  if (existing) {
    return existing;
  }
  const response = await fetch(`${BACKEND_URL}/api/cart`, {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Cart creation failed: ${response.status}`);
  }
  const { cart_id } = (await response.json()) as { cart_id: string };
  cookies().set(CART_COOKIE, cart_id, CART_COOKIE_OPTIONS);
  return cart_id;
}

async function cartRequest(path: string, init: RequestInit = {}): Promise<void> {
  const cartId = cookies().get(CART_COOKIE)?.value;
  const response = await fetch(`${BACKEND_URL}/api/cart${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      cookie: cartId ? `cart_id=${cartId}` : "",
      "content-type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Cart request failed: ${response.status}`);
  }
  // The backend may have issued a fresh cart (stale cookie, DB reset);
  // mirror it so the session self-heals.
  if (response.status !== 204) {
    const body = (await response.json()) as { cart_id?: string };
    if (body.cart_id && body.cart_id !== cartId) {
      cookies().set(CART_COOKIE, body.cart_id, CART_COOKIE_OPTIONS);
    }
  }
}

export async function addToCart(productSlug: string): Promise<void> {
  await ensureCartId();
  await cartRequest("/items", {
    method: "POST",
    body: JSON.stringify({ product_slug: productSlug }),
  });
  revalidatePath("/", "layout");
}

export async function updateCartItem(itemId: number, quantity: number): Promise<void> {
  await cartRequest(`/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  revalidatePath("/", "layout");
}

export async function removeCartItem(itemId: number): Promise<void> {
  await cartRequest(`/items/${itemId}`, {
    method: "DELETE",
  });
  revalidatePath("/", "layout");
}
