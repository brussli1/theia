# Theia

E-commerce catalog and storefront for ophthalmological equipment, sold to professionals in Paraguay and abroad. See `CONTEXT.md` for the domain glossary.

One Next.js 16 app with Payload CMS 3 embedded: the storefront, the admin panel (`/admin`) and the API all run in the same process, backed by PostgreSQL.

## Layout

- `src/app/(frontend)/[locale]/` — storefront pages (Spanish default, English under `/en`).
- `src/app/(payload)/` — Payload admin panel and REST/GraphQL API (`/admin`, `/api`).
- `src/collections/`, `src/globals/`, `src/blocks/` — content model (products, categories, brands, orders, quote requests, pages, posts, header/footer/settings).
- `src/lib/` — data access, server actions, payments (`src/lib/payments/`), email, currency/geo.
- `scripts/` — `seed-content.ts` (demo pages, posts, globals) and `import-legacy.ts` (one-time import of the previous catalog).
- `compose.yaml` — development Postgres only.
- `docs/` — agent configuration (`docs/agents/`) and research notes (`docs/research/`).

## Local development

```bash
cp .env.example .env        # fill PAYLOAD_SECRET, PREVIEW_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d        # Postgres on localhost:5433
npm install
npm run dev                 # http://localhost:3000, admin at /admin
```

The first admin user is created on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. In development Payload pushes the schema automatically; no migrations needed.

Optional data:

```bash
npm run import:legacy       # previous catalog from legacy-data/ (gitignored)
npm run seed                # demo pages, posts, header/footer/settings
```

## Payments

`PAYMENT_MODE=sandbox` (the default) simulates card (Bancard) and PayPal, so checkout works end to end without merchant accounts. Bank transfer and Western Union are manual: an admin marks the order paid. Real gateway keys go in `.env` with `PAYMENT_MODE=production`.

## Checks

```bash
npm run typecheck
npm run lint
```

## Agent skills

See `AGENTS.md`.
