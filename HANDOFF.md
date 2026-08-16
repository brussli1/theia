# Handoff — Theia (ophthalmological e-commerce rebuild) — session 13

**Date:** 2026-08-16
**Prepared for:** a fresh agent continuing this project. Session 13 delivered the **first slice of #25 (content fidelity)**: a written study of a USO product page mapping every content block into Theia's model/PDP, all decisions recorded, and the implementation broken into six ready-for-agent tickets (#26–#31). **This file lives at the repo root (`HANDOFF.md`) and is the canonical handoff — supersede it in place at the end of each session.**

## TL;DR

- **#25 study (first slice, done):** `docs/research/uso-content-fidelity.md` — block-by-block inventory of the live ERK-770 page (cross-checked against a loupe with options, a table-driven description, and the homepage) + catalog-wide counts + 8 decisions (D1–D8). Published on #25 as comments.
- **Key findings:** (1) USO's Description tab and Specifications tab are **NOT in `/products.json`** — rendered-page/metafield content; real specs coverage needs a one-time page crawl (~627 pages). (2) 627/661 products carry the `#iris-related` cross-link block; body structure is bold lead-ins, not semantic headings (630 `<strong>`, 4 `<h*>`, 1 list). (3) 165 products have real variant options; 600 have positive USD prices; 106 imageless; 227 uncategorized.
- **Decisions:** D1 structured description (`description_html` sanitized allowlist, `description` stays plain); D2 specs from genuine 2-col tables only; D3 cross-links as data (`cross_links` JSONB), never USO copy; D4 options → spec rows, no variant model; **D5 pricing: owner decided KEEP quote-only** (reversible — source prices stay in `uso_inventory.json`); D6 uncategorized stay out of menu; **D7 design: NO phakos carryover, NO USO mirroring — modern design on Theia's own terms**; D8 `image_alt` array + array order = display order, index 0 = hero.
- **Tickets (#26–#31, all `ready-for-agent`):** #26 structured description + image metadata (start now); #27 specs extraction + options (start now); #28 image gap fill (start now); #29 cross-links (blocked by #26); #30 modern design prototype (start now); #31 design build (blocked by #30+#26+#27+#29). Native GitHub dependency edges are **not enabled** on this repo (API 404s) — the `Blocked by:` lines in ticket bodies are the edges.
- All green: 156 backend pytest, 19 vitest, tsc + eslint clean, Playwright 59 passed + 4 import-dependent skips.

## State of the dev stack (what's running)

- Postgres compose on **5433** (dev DB `theia`), backend on **8000**, frontend dev on **3000** (log `/tmp/opencode/frontend-dev.log`). Backend dev env: `DATABASE_URL=postgresql+asyncpg://theia:theia@localhost:5433/theia`, `ADMIN_EMAIL=admin@theia.test`, `ADMIN_PASSWORD=admin-secret-pass-123`.
- Dev DB: 4 demo products + 2 demo categories + **661 USO products, 104 USO categories, 31 brands**, media in `backend/media/shopify/<handle>/` (~660MB, gitignored).
- **Restart backend whenever backend code changes** (`setsid nohup env ... .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/opencode/backend-dev.log 2>&1 < /dev/null & disown` — background the server with `setsid`+`disown` and let the shell command end, otherwise the tool timeout kills it).

## The USO import system (how to run it)

From `backend/`, with `DATABASE_URL=postgresql+asyncpg://theia:theia@localhost:5433/theia`:

1. `.venv/bin/python -m scripts.uso_inventory --out uso_inventory.json` — crawls `/products.json` + `/collections.json` → inventory JSON + printed report (661 products, 228 collections, vendors, image gaps). **Read-only.**
2. `.venv/bin/python -m scripts.uso_import --inventory uso_inventory.json [--force]` — imports. Membership (product→collections) comes from `uso_membership.json` **cache** (re-crawl with `--refresh-membership`; the store has NO `/collects.json` and rate-limits hard — see gotchas). Idempotent: without `--force` it skips when imported products exist; `--force` replaces only imported rows (state tracked in `uso_import_state.json`, which also covers legacy `-2` slug rows). Images download into `media/shopify/<handle>/` in parallel (16 workers) and are skipped when the file exists.
3. Artifacts (all gitignored, live in `backend/`): `uso_inventory.json`, `uso_membership.json`, `uso_import_state.json`, `uso_uncategorized.json` (227 products in long-tail collections outside the menu), `uso_imageless.json` (106 products).

## Study reference (read before touching #26–#31)

`docs/research/uso-content-fidelity.md` is the canonical study. The four implementation tickets carry the decisions inline, but read the study's section 1 (block table) and section 3 (decisions) first — especially:

- **The Description tab and Specifications tab are theme/metafield content, not crawlable via `/products.json`.** #27's specs extraction covers only the ~5 genuine key/value tables in body_html; real coverage is a rendered-page crawl (627 pages, reuse `fetch_with_backoff` + a `uso_specs.json` cache) — a follow-up ticket, not yet created.
- **Do NOT parse `title_table`/`explain_table` marketing rows as specs** (they are prose sections with inline images — D2) and **do NOT promote body_html inline images to the gallery** (D8).
- **Design stance (D7):** Theia's current storefront structure is a carryover from **phakos** (the legacy Svelte+DaisyUI site: emerald theme, carousel hero, "Lo Nuevo"/"Popular"/"Promociones" sections, image-top card grid). Both phakos's design and USO's design are forbidden as references for the redesign; the mapping in the study is a content map, not a design blueprint.

## Gotchas (from this and previous sessions — read before touching anything)

- **E2E ordering with the import:** the documented E2E workflow is `seed_demo --force` → `playwright test --workers=1` → re-run `uso_import --force` to restore the catalog. The 4 menu specs in `e2e/catalog.spec.ts` `test.skip()` when the imported tree is absent. The two demo-count specs ("1 productos"/"2 productos") fail after any mutation run — always reseed before a full E2E run.
- **Shopify rate limiting:** usophthalmic.com 429s aggressively (71/228 collections failed at 0.15s spacing; 89+ still failed at 0.4s). Use `fetch_with_backoff` (spacing beats retries) + the membership cache. `fetch_items` stops at a short page (`len(batch) < limit`) — don't "fix" it back to empty-page pagination, the tests encode the short-page contract.
- **`taken_slugs` must be re-read AFTER the force-delete** in `_import_catalog`, or every re-imported row gets a `-2` slug — and `-2` slugs then make `already_imported` empty so force-deletes never fire (the cascade that cost hours in session 12).
- **Duplicate menu handles** (`biometer`, `handheld-tonometers`, `portable-lensmeters` appear in two menu places): `build_category_plan` aliases them to ONE category slug; the importer skips inserting duplicate slug rows. Don't "dedupe" this back.
- **`_import_catalog` state file is CLI-only** (param `state_file`); the pytest integration tests must never read/write the real state file (they run from `backend/`).
- **Menu touch interaction:** `CategoryMenu` triggers are open-only on click (hover uses mouse-only `pointerenter`); a tap fires focus→click, so a toggle would immediately re-close the panel. Mobile E2E uses `browser.newContext({ hasTouch: true })`.
- **The mega-menu panel** is `absolute`, `max-h-[70vh]`, `max-w-[min(90vw,48rem)]`, scrollable — keep the responsive constraints if you restyle.
- **`findNodeBySlug` must recurse to depth 3** (root → subgroup → leaf); the first version only flattened two levels and leaf pages 404'd while E2E stayed green (tests now assert real page content, not just URLs).
- **`#25` title caveat:** the study discovered USO's H1 is often rewritten by the theme (e.g. "Ezer Autorefractor Keratometer ERK-770" vs Shopify title "Ezer ERK-770 Autorefrator Keratometer Full Automatic" — note the source-data typo "Autorefrator"). `Product.name` imports Shopify's `title` verbatim — 1:1 with USO's data, acceptable.
- All previous-session gotchas still hold (Next.js client/server boundary, server-action cookie mirroring, footer/header link-name scoping in E2E, postgres 5433 vs 5432, git identity via `-c user.name="brussli1" -c user.email="brussli1@users.noreply.github.com"`).
- The **public categories API now returns `{id, slug, name, parent_id}`** (was `{slug, name}`); `ProductPage.categories`/`brands` facets are still plain `{slug, name}`.

## Suggested skills

- `/implement` for #26/#27/#28/#30 (frontier now); `/to-tickets` for the rendered-page specs-crawl follow-up; `/research` for #28's vendor image sourcing.
- `/code-review` after each implement session — session 12's reviews caught the depth-3 404, the `taken_slugs`/-2 cascade, the state-file test pollution, and the touch race.

## Redactions / notes

- No tokens/keys in this doc or the repo. DB creds above are local-compose defaults already in `compose.yaml`/`config.py`/`conftest.py`. Gateway/notification/WhatsApp secrets stay empty in the repo.
- Import artifacts (`uso_*.json`) and `backend/media/` are gitignored — do not commit them. `.env.production.example` is the committed secrets template.
- The USO content rights assumption (vendor-supplied marketing images/descriptions) was confirmed by the owner as their responsibility; #28's image work should keep the per-vendor sourcing report approach.
- USO marketing copy (iris blocks, buyer-guide text) must **not** be reproduced wholesale in Theia (per #25 out-of-scope) — cross-links become data (D3), buyer-guide content would be original Theia pages.
- `docs/research/uso-content-fidelity.md` is new and **uncommitted** — the study should be committed with the first implement ticket's branch.
