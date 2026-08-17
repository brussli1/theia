# Handoff — Theia (ophthalmological e-commerce rebuild) — session 15

**Date:** 2026-08-16
**Prepared for:** a fresh agent continuing this project. Session 15 implemented **#28 (image gap fill)** — 15 of the 106 imageless products sourced with verified primary-source images; the remaining 91 are internal service spare parts with no public listing (documented, not blocked). **This file lives at the repo root (`HANDOFF.md`) and is the canonical handoff — supersede it in place at the end of each session.**

## TL;DR

- **#28 (ready for sign-off/close):** research-shaped per-vendor sourcing report `docs/research/uso-image-sourcing.md` + machine-readable map `backend/uso_image_sourcing.json` (gitignored) + fill script `backend/scripts/uso_fill_images.py` (patches `uso_inventory.json` in place so re-imports keep the images, downloads into `media/shopify/<handle>/0.jpg`, updates only the affected DB rows — no `--force` re-import needed).
- **15 verified fills** — the full devices/accessories: Neitz EZ-OPH-1800 + BXα-13 ophthalmoscopes + BXα-RC-USB-LED + NTZ loupe frame/headband + belt hook (neitz.co.jp + USO sibling pages), Ezer Panorama, ERK-BH wifi set, iiNEER, Tele Eye Care, 2WIN-APP, EZ bulb, VS chair foot pedal, ODROID-C4 (hardkernel.com). Alt text from source or title fallback.
- **91 unverified** — internal Ezer/USO service spare parts (`*epcb*` PCBs, `*ehar*` harnesses, `*massy*` assemblies, numbered mechanicals, Huvitz `cp-13`, Schioppa casters). Their USO pages render the Shopify no-image placeholder; no vendor publishes them. **Do not invent images for these.**
- **Commits:** `6bc62ce` (session-14 handoff) → this session adds the report, script, test, .gitignore entries.
- All green: **169 backend pytest (was 168; +1 patch_inventory test), 19 vitest, tsc + eslint clean**.

## State of the dev stack (what's running)

- Postgres compose on **5433** (dev DB `theia`), backend on **8000** (log `/tmp/opencode/backend-dev.log`), frontend dev on **3000** (log `/tmp/opencode/frontend-dev.log`). Backend dev env: `DATABASE_URL=postgresql+asyncpg://theia:theia@localhost:5433/theia`, `ADMIN_EMAIL=admin@theia.test`, `ADMIN_PASSWORD=admin-secret-pass-123`.
- Dev DB: 4 demo products + 2 demo categories + **661 USO products, 104 USO categories, 31 brands**, media in `backend/media/shopify/<handle>/` (~660MB, gitignored). Live catalog re-imported session 14 with the content-fidelity fields; session 15 filled 15 image gaps (verified on neitz-ez-oph-1800, ntz-headband, odroid-c4).
- **Restart backend whenever backend code changes** (`setsid nohup env ... .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/opencode/backend-dev.log 2>&1 < /dev/null &` — let the shell command end; note `kill <pid>` uses the pid printed by the launch, and **never `pkill -f "uvicorn app.main:app"` — the pattern matches the invoking shell and kills it**; use `pkill -f "uvicorn app[.]main"`).

## The USO import system (how to run it)

From `backend/`, with `DATABASE_URL=postgresql+asyncpg://theia:theia@localhost:5433/theia`:

1. `.venv/bin/python -m scripts.uso_inventory --out uso_inventory.json` — crawls `/products.json` + `/collections.json` → inventory JSON + printed report. **Read-only.** Now carries `image_alts` (aligned with `images`) and `options` (named options, "Title" kept as-is — the importer filters it).
2. `.venv/bin/python -m scripts.uso_import --inventory uso_inventory.json [--force]` — imports. Idempotent; `--force` replaces only imported rows. Wires `description_html`, `image_alt` (with failed-download filtering), `specifications` (table rows + "Available options" row).
3. `.venv/bin/python -m scripts.uso_fill_images --inventory uso_inventory.json --sourcing uso_image_sourcing.json` — image-gap fill (#28). Patches the inventory in place (so re-imports keep the images), downloads verified source images into `media/shopify/<handle>/0.jpg`, updates only the affected DB rows. Safe to re-run; needs `DATABASE_URL` in env.
4. Artifacts (all gitignored, live in `backend/`): `uso_inventory.json`, `uso_membership.json`, `uso_import_state.json`, `uso_uncategorized.json`, `uso_imageless.json`, `uso_image_sourcing.json`, `uso_imageless_detail.json`.

## Open tickets (frontier)

- **#28 image gap fill (implemented, awaiting sign-off):** 15 of 106 imageless products filled with verified primary-source images; report `docs/research/uso-image-sourcing.md`, map `uso_image_sourcing.json`, script `uso_fill_images.py`. 91 remain unverified — internal service spare parts with no public listing (documented per handle; don't invent images). Close after owner review.
- **#30 modern design prototype (ready-for-agent, start now):** throwaway prototype of Theia's own design language (D7 — no phakos carryover, no USO mirroring); category tiles with counts; owner preview + sign-off recorded on the ticket before #31 starts.
- **#29 cross-links as data:** no longer blocked (#26 closed) — extract `#iris-*` links into `cross_links` JSONB at import, render a Related section; blocked by nothing now.
- **#31 design build:** blocked by #30 sign-off (+#26/#27/#29 now done).
- Follow-up (not yet created): rendered-page specs crawl (~627 pages, `uso_specs.json` cache) — real spec coverage is the only way to get the ERK-770-grade tables. Could also re-check the 91 unverified image gaps there.

## Gotchas (read before touching anything)

- **E2E ordering with the import:** documented workflow is `seed_demo --force` → `playwright test --workers=1` → re-run `uso_import --force` to restore the catalog. The compose `frontend` container is a **stale production build** — for E2E stop it (`docker compose stop frontend`) and run the dev server (`npm run dev`, log `/tmp/opencode/frontend-dev.log`); playwright reuses both servers (`reuseExistingServer`) so run `seed_demo --force` yourself first.
- **Conftest seed gotcha:** `seed_products()` INSERT in `tests/conftest.py` must list columns and `%s` placeholders in lockstep with `demo_catalog.PRODUCTS` tuple order (now 16 fields; `_adapt` wraps index 12 = specifications as Json — empty-list-adapts-to-jsonb-object trap). psycopg2 adapts Python lists to `text[]` fine.
- **`image_destinations` index trap:** `entries` carry the *global* download index (`len(pending_downloads)-1`), not the per-product index — the `image_alt` comprehension must `enumerate(entries)` for per-product position (the bug only surfaced on the second image-bearing product).
- **Shopify rate limiting:** usophthalmic.com 429s aggressively — use `fetch_with_backoff` (spacing beats retries) + the membership cache. `fetch_items` stops at a short page — don't "fix" it back to empty-page pagination.
- **`taken_slugs` must be re-read AFTER the force-delete** in `_import_catalog`, or every re-imported row gets a `-2` slug — and `-2` slugs then make `already_imported` empty so force-deletes never fire.
- **Duplicate menu handles** (`biometer`, `handheld-tonometers`, `portable-lensmeters` appear in two menu places): `build_category_plan` aliases them to ONE category slug; the importer skips inserting duplicate slug rows. Don't "dedupe" this back.
- **`_import_catalog` state file is CLI-only** (param `state_file`); pytest integration tests must never read/write the real state file.
- **Sanitizer contract:** `description_html` is written only by `uso_import` (sanitized) and `seed_demo` (hand-authored); the admin API has no write path for it. If that ever changes, the sanitizer is the only gate between source HTML and the browser.
- **Menu touch interaction:** `CategoryMenu` triggers are open-only on click; mobile E2E uses `browser.newContext({ hasTouch: true })`. The mega-menu panel is `absolute`, `max-h-[70vh]`, `max-w-[min(90vw,48rem)]`, scrollable.
- **`findNodeBySlug` must recurse to depth 3** (root → subgroup → leaf); E2E asserts real page content, not just URLs.
- All previous-session gotchas still hold (Next.js client/server boundary, server-action cookie mirroring, footer/header link-name scoping in E2E, postgres 5433 vs 5432, git identity via `-c user.name="brussli1" -c user.email="brussli1@users.noreply.github.com"`).
- The **public categories API returns `{id, slug, name, parent_id}`** (was `{slug, name}`); `ProductPage.categories`/`brands` facets are still plain `{slug, name}`.
- `#25` title caveat: USO's H1 is often rewritten by the theme; `Product.name` imports Shopify's `title` verbatim — 1:1 with USO's data, acceptable.

## Suggested skills

- `/implement` for #29 (now unblocked) — it owns the `cross_links` extraction in the same importer path; `/prototype` for #30.
- `/code-review` after each implement session — session 14's review caught the scheme-relative href hole and the unbalanced-drop swallow.
- `/research` already used for #28; if more image gaps get filled later, extend `uso_image_sourcing.json` (verified entries only) and re-run `uso_fill_images.py`.

## Redactions / notes

- No tokens/keys in this doc or the repo. DB creds above are local-compose defaults already in `compose.yaml`/`config.py`/`conftest.py`.
- Import artifacts (`uso_*.json`) and `backend/media/` are gitignored — do not commit them (`.gitignore` now covers `uso_image_sourcing.json` + `uso_imageless_detail.json` too). `.env.production.example` is the committed secrets template.
- USO marketing copy (iris blocks, buyer-guide text) must **not** be reproduced wholesale in Theia (per #25 out-of-scope) — cross-links become data (D3), buyer-guide content would be original Theia pages. The `clean_alt` first-pipe-segment trim exists precisely because the source alt text repeats store boilerplate.
- `docs/research/uso-content-fidelity.md` + `docs/research/uso-image-sourcing.md` + this handoff are committed.
