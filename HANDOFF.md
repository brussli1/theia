# Handoff — Theia — session 16

**Date:** 2026-10-20
**Prepared for:** a fresh agent continuing this project. This file is the canonical handoff; supersede it in place at the end of each session.

## TL;DR

- Between session 15 (Aug 16) and now, the app was **rebuilt on Next.js 16 + Payload CMS 3** (single app: storefront, admin and API in one process, Postgres). The old FastAPI `backend/` and Next.js 14 `frontend/` are deleted.
- Session 16 committed the rebuild on branch `rebuild`, fixed the one `tsc` error (`scripts/seed-content.ts`), and rewrote `README.md`. `npm run typecheck` and `npm run lint` are clean.
- **Payment providers come later** (owner decision). Keep `PAYMENT_MODE=sandbox`; card (Bancard) and PayPal are simulated, transfer and Western Union are manual. No payment work until merchant accounts arrive.
- Not yet verified: the app has not been run end to end since the rebuild was committed.

## What the rebuild contains

- Collections: Products, Categories (nested-docs), Brands, UsedEquipment, Orders, QuoteRequests, Customers, Users (admins), Pages, Posts, Media, Subscribers. Globals: Header, Footer, SiteSettings.
- Storefront (`src/app/(frontend)/[locale]/`): home, productos, categorias, marcas, usados, blog, carrito, checkout, pedido, seguimiento, cotizacion, cuenta (+ password reset), pago (paypal/bancard/prueba), catch-all pages, sitemap, robots.
- Plugins: nested-docs, redirects, SEO. Locales `es` (default) and `en`. Live preview. Nodemailer email (logs to console without `SMTP_HOST`).
- Payments: `src/lib/payments/` — one interface; Bancard charges in guaraníes, PayPal in dollars, manual methods follow the visitor's currency.
- Legacy import: `npm run import:legacy` reads `legacy-data/catalog.json` + `legacy-data/media/` (gitignored; 661 products, 104 categories, 30 brands exported from the old DB). Re-runnable; state in `legacy-data/import-state.json`.

## Next steps (in order)

1. **Verify it runs:** `docker compose up -d` (DB container `theia-db-1` exists but is stopped), `npm run dev`, `npm run import:legacy`, `npm run seed`, then click through every page, the admin, and a sandbox checkout.
2. **Tests:** `package.json` has `test:unit` (vitest) and `test:e2e` (Playwright) scripts, but no configs or test files exist. Cover: catalog browse, cart → sandbox checkout → order page, quote request, signup/login, admin marks order paid.
3. **Production readiness:** `src/migrations/index.ts` is empty — generate the initial migration (`npm run payload migrate:create`). Add a production Dockerfile + `compose.prod.yaml` + reverse proxy. `docs/deploy.md` still describes the deleted FastAPI stack — rewrite it.
4. **Issue triage on GitHub:** #20, #25, #28, #29 target the old backend — close or re-scope. Check whether the rebuild's design already covers #30/#31. #1 (MVP epic) stays open.
5. **Payments (later):** when providers are chosen, set keys in `.env`, `PAYMENT_MODE=production`, and test against each gateway's sandbox. Background: `docs/research/card-payments-paraguay.md`.

## Gotchas

- `.npmrc` sets `legacy-peer-deps=true` — came with the rebuild, presumably for peer-range conflicts; don't remove without checking `npm install` still works.
- Dev Postgres is on **5433**, database `theia_site` (not `theia` as in the old stack).
- Development uses Payload schema push; production must use migrations — regenerate after any collection change.
- `media/` (Payload uploads) and `legacy-data/` are gitignored — never commit them.
- `CONTEXT.md` glossary was written for the old stack; terms still apply but check details (e.g. order statuses, Payment model) against `src/collections/Orders.ts`.
- `AGENTS.md` mentions `docs/adr/` — it does not exist yet.
- Git identity used for commits: `brussli1 <brussli1@users.noreply.github.com>`.
