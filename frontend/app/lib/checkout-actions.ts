"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND_URL, CART_COOKIE } from "./backend";

export type CheckoutError = "cart_empty" | "unavailable" | "failed";

export type CheckoutState = { error?: CheckoutError };

/** Guest checkout: sends the cart cookie and checkout payload to the backend,
 * then redirects to the order confirmation page. Errors are returned so the
 * form can show a localized message. */
export async function placeOrder(formData: FormData): Promise<CheckoutState> {
  const cartId = cookies().get(CART_COOKIE)?.value;
  const payload = {
    email: formData.get("email"),
    phone: formData.get("phone"),
    delivery_type: formData.get("delivery_type"),
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    region: (formData.get("region") as string | null) || null,
    postal_code: (formData.get("postal_code") as string | null) || null,
    country: formData.get("country"),
    notes: (formData.get("notes") as string | null) || null,
  };
  const response = await fetch(`${BACKEND_URL}/api/orders`, {
    method: "POST",
    cache: "no-store",
    headers: {
      cookie: cartId ? `cart_id=${cartId}` : "",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    if (response.status === 409) {
      return { error: "unavailable" };
    }
    return { error: response.status === 400 ? "cart_empty" : "failed" };
  }
  const { order_number } = (await response.json()) as { order_number: string };
  const email = String(payload.email);
  redirect(`/pedido/${order_number}?email=${encodeURIComponent(email)}`);
}
