/** Server-only settings shared by the server-action modules. */

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
export const CART_COOKIE = "cart_id";
