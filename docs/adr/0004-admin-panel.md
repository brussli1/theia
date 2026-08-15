# ADR 0004: The admin panel is gated by an admin role on User, bootstrapped from configuration; catalog management is a dedicated account-only API

- **Status:** accepted (2026-08-15)
- **Ticket:** #15 Admin — catalog (parent spec: #1)
- **Context:** the storefront needed a management surface for the catalog — products (create / edit / deactivate), categories and brands (CRUD), the curated homepage collections, and product image uploads. There was no admin concept: #14 introduced optional accounts (`users` with email + PBKDF2 password hash) and JWT sessions with `get_current_user`, but every account was a customer. The admin role had to be invented; the question was how admins authenticate and how the panel is shaped.

## Decision

1. **Admins are Users with `role = 'admin'`; registration never grants it.** The `users` table gains a `role` column (`customer` default). `POST /api/auth/register` always creates customers. The only way a `User` becomes an admin is the bootstrap in `app/core/admin.py::ensure_admin`, which runs at application startup when both `admin_email` and `admin_password` settings are set — idempotent upsert that re-asserts the role and refreshes the password hash, so rotating the password is a restart with new settings. Credentials follow the repo convention: empty by default, dev/CI may set them freely, production must. The existing login endpoint and JWT flow work unchanged; `AuthOut`/`UserOut` now carry `role` so the Next.js boundary can route admins to the panel.
2. **The panel is a dedicated account-only API under `/api/admin`**, protected by `get_current_admin` (401 without a session, 403 for a signed-in customer). It manages the same tables the storefront reads — no separate admin data store. Products have create, edit (full payload PUT) and **deactivate** (`available = false`); there is no hard product delete, because orders and collections reference products. Categories and brands have full CRUD with auto-derived slugs; deleting one leaves its products uncategorized/unbranded via the existing SET NULL foreign keys. Collections are curated by PUTting the ordered product-id list of one of the three fixed types (`carousel` | `popular` | `promo`); order is preserved by position.
3. **Product images are uploaded to the backend and served from it.** `POST /api/admin/images` accepts one JPEG/PNG/WebP/GIF ≤ 5 MB, stores it under `media_dir` with a uuid filename, and returns an absolute URL built from `media_url` — the browser loads it straight from `/media` (a FastAPI StaticFiles mount), so the stored `images` list keeps holding plain URL strings with no frontend rewrites. No untrusted filename is ever used; content type is validated, not sniffed from the client filename.

## Consequences

- The customer surface is untouched: register/login/me gain a `role` field, guest checkout stays, and customers hitting `/admin` see an access-denied page.
- Admin login reuses the account forms; after login the auth server action redirects admins to `/admin` and customers to `/cuenta`.
- Bootstrapping from settings means there is no admin-management UI and no self-service escalation; an admin who loses the password is re-created by restarting with `admin_password` set (hash refreshed, id unchanged).
- Slugs are derived from names once (accent-normalized); edits do not re-slug, so URLs stay stable. Uniqueness is enforced by appending `-2`, `-3`, …
- Image uploads land on the backend's filesystem (`backend/media/`, gitignored); a future deploy must persist that directory or move to object storage (#18).
- The homepage collections now have a maintenance surface; the previous "admin-curated" claim in the collections model docstring is finally backed by an admin.
