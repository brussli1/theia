"use server";

import { redirect } from "next/navigation";
import { accountAuthorizationHeader, BACKEND_URL } from "./backend";

export type QuoteError = "invalid_product" | "failed";

export type QuoteState = { error?: QuoteError };

/** Submits a quote request (quote-only product, used equipment, or rental)
 * and redirects to the confirmation page, which loads it by reference plus
 * the email used. The session token is forwarded so the request is attached
 * to the account when the customer is signed in (#14). Errors are returned
 * so the form can show a localized message. */
export async function submitQuote(formData: FormData): Promise<QuoteState> {
  const payload = {
    kind: formData.get("kind"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: (formData.get("message") as string | null) || null,
    product_slug: (formData.get("product_slug") as string | null) || null,
  };
  const response = await fetch(`${BACKEND_URL}/api/quotes`, {
    method: "POST",
    cache: "no-store",
    headers: {
      authorization: accountAuthorizationHeader(),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    // 400/404: the product is orderable or does not exist.
    return { error: response.status === 400 || response.status === 404 ? "invalid_product" : "failed" };
  }
  const body = (await response.json()) as { reference: string; email: string };
  redirect(`/cotizacion/${body.reference}?email=${encodeURIComponent(body.email)}`);
}
