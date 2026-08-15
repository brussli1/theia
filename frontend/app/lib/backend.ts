/** Server-only settings shared by the server-action modules. */

import { cookies } from "next/headers";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
export const CART_COOKIE = "cart_id";
/** Session token for the signed-in customer (#14); kept in an httpOnly cookie
 * by the auth server actions and forwarded to the backend by every request
 * that should act as the account. */
export const AUTH_COOKIE = "auth_token";

/** The API expects the session as `Authorization: Bearer`; the browser keeps
 * it in the `auth_token` cookie, so the cookie is translated here. Empty
 * when the visitor is not signed in. Server-only. */
export function accountAuthorizationHeader(): string {
  const token = cookies().get(AUTH_COOKIE)?.value;
  return token ? `Bearer ${token}` : "";
}
