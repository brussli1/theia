"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountAuthorizationHeader, BACKEND_URL } from "./backend";

/**
 * Admin panel mutations (#15). Every call is authenticated as the signed-in
 * account; the backend answers 401 without a session and 403 for customers,
 * both of which bounce the visitor back to the panel gate.
 */

async function adminRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      authorization: accountAuthorizationHeader(),
    },
  });
}

function bounceIfUnauthenticated(response: Response): void {
  if (response.status === 401 || response.status === 403) {
    revalidatePath("/", "layout");
    redirect("/admin");
  }
}

function parseNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  // Empty selects submit "", which Number() would turn into 0.
  if (raw === null || raw === "") {
    return null;
  }
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function splitCertifications(formData: FormData): string[] {
  const raw = (formData.get("certifications") as string | null) ?? "";
  return raw
    .split(",")
    .map((certification) => certification.trim().toUpperCase())
    .filter(Boolean);
}

/** Uploads a product image and returns the URL the backend serves it from.
 * Called from the client product form; errors propagate as a rejection. */
export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  const response = await adminRequest("/api/admin/images", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }
  return (await response.json()) as { url: string };
}

/** Creates (productId null) or updates a product, then returns to the list. */
export async function saveProduct(formData: FormData, productId: number | null): Promise<void> {
  const payload = {
    name: (formData.get("name") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    price_gs: parseNumber(formData, "price_gs"),
    price_usd: parseNumber(formData, "price_usd"),
    available: formData.get("available") === "on",
    orderable: formData.get("orderable") === "on",
    certifications: splitCertifications(formData),
    images: formData.getAll("image").filter((value) => typeof value === "string"),
    specifications: JSON.parse((formData.get("specifications") as string) ?? "[]"),
    category_id: parseNumber(formData, "category_id"),
    brand_id: parseNumber(formData, "brand_id"),
  };
  const path = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
  const response = await adminRequest(path, {
    method: productId ? "PUT" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Product save failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/productos");
}

/** Deactivates (available false) or reactivates a product from the list. */
export async function toggleProductAvailability(
  productId: number,
  available: boolean,
): Promise<void> {
  const current = await fetch(`${BACKEND_URL}/api/admin/products/${productId}`, {
    cache: "no-store",
    headers: { authorization: accountAuthorizationHeader() },
  });
  bounceIfUnauthenticated(current);
  if (!current.ok) {
    throw new Error(`Product fetch failed: ${current.status}`);
  }
  const product = (await current.json()) as {
    name: string;
    description: string;
    price_gs: number;
    price_usd: string;
    certifications: string[];
    images: string[];
    specifications: unknown;
    category_id: number | null;
    brand_id: number | null;
  };
  const response = await adminRequest(`/api/admin/products/${productId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...product,
      available,
    }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Product update failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

/** Creates (id null) or renames a category; slugs are derived by the backend. */
export async function saveCategory(
  formData: FormData,
  categoryId: number | null,
): Promise<void> {
  const name = (formData.get("name") as string | null) ?? "";
  const path = categoryId ? `/api/admin/categories/${categoryId}` : "/api/admin/categories";
  const response = await adminRequest(path, {
    method: categoryId ? "PUT" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Category save failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const response = await adminRequest(`/api/admin/categories/${categoryId}`, {
    method: "DELETE",
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Category delete failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

/** Creates (id null) or renames a brand; slugs are derived by the backend. */
export async function saveBrand(formData: FormData, brandId: number | null): Promise<void> {
  const name = (formData.get("name") as string | null) ?? "";
  const path = brandId ? `/api/admin/brands/${brandId}` : "/api/admin/brands";
  const response = await adminRequest(path, {
    method: brandId ? "PUT" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Brand save failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

export async function deleteBrand(brandId: number): Promise<void> {
  const response = await adminRequest(`/api/admin/brands/${brandId}`, {
    method: "DELETE",
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Brand delete failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

/** Replaces the products of one curated collection, preserving order. */
export async function saveCollection(
  collectionType: string,
  productIds: number[],
): Promise<void> {
  const response = await adminRequest(`/api/admin/collections/${collectionType}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ product_ids: productIds }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Collection save failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

/** Moves an order's status along; marking it `paid` also confirms its pending
 * payment — the manual path for Western Union transfers (#16). */
export async function setOrderStatus(
  orderId: number,
  formData: FormData,
): Promise<void> {
  const status = (formData.get("status") as string | null) ?? "";
  const response = await adminRequest(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Order status update failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}

/** Marks a quote request responded or closed (#16). */
export async function setQuoteStatus(
  quoteId: number,
  formData: FormData,
): Promise<void> {
  const status = (formData.get("status") as string | null) ?? "";
  const response = await adminRequest(`/api/admin/quotes/${quoteId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  bounceIfUnauthenticated(response);
  if (!response.ok) {
    throw new Error(`Quote status update failed: ${response.status}`);
  }
  revalidatePath("/", "layout");
}
