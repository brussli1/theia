# ADR 0003: Accounts are optional, sessioned by signed JWT in an httpOnly cookie, and linked to their orders and quotes

- **Status:** accepted (2026-08-15)
- **Ticket:** #14 Accounts (parent spec: #1, stories 24–26)
- **Context:** the storefront worked without identity — checkout and quote submission collected an email, and orders/quotes were looked up by reference + email. #14 makes accounts optional: register/log in, and see order and quote history, while guest checkout stays. There was no auth infrastructure, no password storage, and the repo ships no secrets; payments (#12) and notifications (#13) established the pattern of a seam with an empty-by-default configuration and a dev/CI fallback.

## Decision

1. **Accounts are optional; guest records stay first-class.** `users` rows hold an email (normalized to lowercase, unique), a name, and only a PBKDF2-SHA256 password hash (stdlib `hashlib`, per-user salt, self-describing `pbkdf2_sha256$iterations$salt$hash` format so the work factor can be raised later). Orders and `quote_requests` gain a nullable `user_id` (SET NULL) set when the customer was signed in at checkout/quote submit; guest rows are unlinked and never appear in an account's history. There is no forced email match — a signed-in customer may check out with another email.
2. **Sessions are signed JWTs (HS256) kept in an httpOnly cookie, presented to the API as `Authorization: Bearer`.** The backend reads the header only. The Next.js boundary translates: server components and server actions read the `auth_token` cookie (set/deleted by the auth server actions, mirroring the cart cookie pattern) and send `Authorization: Bearer` to the backend — the backend's own Set-Cookie never reaches the browser. Sessions are stateless, so logging out is the browser discarding the token (no server-side logout endpoint). The signing secret follows the payments/notifications split: `jwt_secret` is empty by default, a fixed development secret is used outside production, and production refuses to sign until it is set.
3. **Register and login return the same shape — token + account —** so registration signs the customer in immediately. Passwords are hashed/verified off the event loop (`asyncio.to_thread`) at 600 000 PBKDF2 iterations, and wrong credentials always answer 401 without revealing whether the email exists.

## Consequences

- Account history (`GET /api/account/orders`, `GET /api/account/quotes`, both newest-first and account-scoped) shows only records created while signed in; pre-#14 orders and guest orders remain viewable by the reference + email lookup only.
- The browser session cookie and the API's Authorization header are deliberately different transports of the same token; any new authenticated call must do the cookie-to-header translation rather than expecting the API to read cookies.
- Passwords can never be recovered, only reset (out of scope); the hash format encodes the iteration count so a future work-factor bump does not invalidate old hashes.
- The JWT has a 30-day expiry (`jwt_expires_minutes`); expired tokens are simply not authenticated — there is no refresh flow (acceptable for an MVP, revisit if sessions outlive 30 days).
- An account cannot be deleted through the API yet; admin (#15/#16) may add user management.
