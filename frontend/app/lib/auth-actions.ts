"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, BACKEND_URL } from "./backend";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  // `secure` is safe on http://localhost (browsers treat it as trustworthy),
  // so dev/E2E keep working while production only ever sends the session
  // token over https.
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
} as const;

export type AuthError = "credentials" | "taken" | "invalid" | "failed";

export type AuthState = { error?: AuthError };

/** Register and login both POST the same shape to the backend and, on
 * success, store the returned session token in the `auth_token` cookie
 * (the backend's Set-Cookie never reaches the browser, so it is mirrored
 * here), then navigate — admins to the admin panel, everyone else to the
 * account page — a full reload, so the server renders with the fresh
 * session. Errors are returned so the form can show a localized message. */
async function authRequest(path: string, formData: FormData): Promise<AuthState> {
  const response = await fetch(`${BACKEND_URL}/api/auth${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: (formData.get("name") as string | null) || undefined,
      email: formData.get("email"),
      password: formData.get("password"),
    }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      return { error: "credentials" };
    }
    if (response.status === 409) {
      return { error: "taken" };
    }
    if (response.status === 422) {
      return { error: "invalid" };
    }
    return { error: "failed" };
  }
  const { token, user } = (await response.json()) as { token: string; user: { role: string } };
  cookies().set(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
  revalidatePath("/", "layout");
  if (user.role === "admin") {
    redirect("/admin");
  }
  redirect("/cuenta");
}

export async function register(formData: FormData): Promise<AuthState> {
  return authRequest("/register", formData);
}

export async function login(formData: FormData): Promise<AuthState> {
  return authRequest("/login", formData);
}

/** Logs out by discarding the session token; sessions are stateless on the
 * backend, so there is nothing to revoke. */
export async function logout(): Promise<void> {
  cookies().delete(AUTH_COOKIE);
  revalidatePath("/", "layout");
  redirect("/cuenta");
}
