# USO content fidelity study: what a USO product page contains and where it maps in Theia

- **Ticket:** #25 (parent spec: #20) — first slice: written inventory of a representative USO product page + decisions for the follow-up implementation slices.
- **Date:** 2026-08-16
- **Method:** Primary source is usophthalmic.com itself. Inventory data (`uso_inventory.json`, crawled 2026-08-15) for the catalog-wide counts; live rendered pages fetched 2026-08-16 for the page-structure walk: `ezer-erk-770-autorefrator-keratometer-full-automatic` (ERK-770), `ntz-blp-6-loupes` (loupe with options), `ims-7000u` (table-driven description), `mwrs` (title_table/explain_table marketing layout), plus the homepage. Theia side read from `backend/app/models/catalog.py`, `backend/scripts/uso_import*.py`, `frontend/app/productos/[slug]/page.tsx`, `frontend/app/components/ProductCard.tsx`.

---

## 1. Representative page, block by block

Walk of the live ERK-770 page (https://usophthalmic.com/products/ezer-erk-770-autorefrator-keratometer-full-automatic), in rendered order. Each block lists its **source in USO's data** (what a crawler can actually retrieve) and its **Theia mapping** (what exists today / what would need to be added).

| # | Block on the USO page | Source available to a crawler | Theia mapping today |
|---|---|---|---|
| 1 | Breadcrumb (mostly empty `<ol>`) | rendered page | none needed (Theia has its own breadcrumb-free header; category pages already exist) |
| 2 | H1 title — **rewritten by the theme**: "Ezer Autorefractor Keratometer ERK-770", while Shopify's `title` is "Ezer ERK-770 Autorefrator Keratometer Full Automatic" (note the typo "Autorefrator" in the data vs "Autorefractor" on the page) | `products.json.title` / rendered page | `Product.name` (currently imports `title` verbatim — 1:1 with USO's data, fine) |
| 3 | Lead prose paragraphs with **bold lead-ins** (`<strong>`) | `products.json.body_html` | `Product.description` — currently flattened to plain text by `html_to_text` (uso_import_lib.py:306); bold/section structure lost |
| 4 | **"Related equipment & resources"** block (`#iris-related`): four labeled lines — Browse related categories / Compare related models / Read next (blog link) / "Backed by US Ophthalmic… Request a quote →" | `body_html` (627 of 661 products carry this exact block) | **not represented at all** — no cross-link fields, no blog/buyer-guide content, no relation model |
| 5 | **"Compare:" callout box** (`#iris-compare`, blue-bordered): "📊 Compare: Read our 2026 buyer's guide featuring the Ezer ERK-770…" | `body_html` (250 products carry buyer-guide/blog links) | **not represented** |
| 6 | Gallery: main photo + thumbnails (`product-single__photos`, 8+ images) | `products.json.images` (already imported, files under `media/shopify/<handle>/`) + per-image `alt` fields (also present in `products.json`) | `Product.images` (ARRAY) — currently **plain URL list**: no alt text, no position/primary-flag metadata. Order of the array does define the gallery order today, but nothing marks the hero image or stores alt |
| 7 | Buy box: **price** (USD; ERK-770 is $0 = quote-only), **"Request a quote"** CTA, **SKU**, InStock badge, "10 visitors are looking this product!" (theme social-proof app) | `products.json.variants[].price` / `sku`; the social-proof counter is a theme widget (not importable) | `Product.price_usd/price_gs` (0/0 for imported) + quote CTA link — orderable=False already wired |
| 8 | **Description tab**: parallax hero banner + feature rows (image + `<b>` heading + `<h3>` blurb) | **NOT in `products.json.body_html`** — rendered by the theme from metafield/app content on the live page. For ERK-770 the Description tab is richer than body_html; for IMS-7000U the tab *is* body_html (a `title_table`/`explain_table` marketing table). So USO pages use two different description sources across products | `Product.description` (plain) |
| 9 | **Specifications tab**: key/value table (`td1_table`/`td2_table` cells: "Sphere Range / -20D to +20D", …, "Weight / About 20KGS") | **NOT in `products.json.body_html`** for ERK-770 — it lives on the rendered page (theme/metafield content). Only 5 products have genuine key/value tables inside body_html (ims-7000u, ims-5000u, ezv-ops-1800, mwrs, ez-horus-endo-coupler); 59 have `<table>` of which most are 1-cell layout tables | `Product.specifications` (JSONB) — exists, currently imported as `[]` |
| 10 | **Reviews tab** (`#shopify-product-reviews` embed) | third-party (Shopify Product Reviews app); not crawled | out of scope (Theia has no reviews) |
| 11 | **Related products** carousel (`related-products-product-template`) | theme-generated; the ERK-770 page's embedded JSON exposes the recommended product list | not represented (cross-links in #4 cover a curated subset) |

### Body-html content statistics (all 661 products)

| Pattern | Count | Meaning |
|---|---|---|
| `#iris-related` block | 627 | cross-link block present on almost everything |
| "Request a quote" CTA in body | 627 | quote path is the canonical CTA |
| buyer-guide / `/blogs/` links | 250 | compare & buyer's-guide content to model |
| `<strong>` bold | 630 | bold lead-ins are the main formatting device |
| `<h1..h6>` headings | 4 | almost no semantic headings — structure is bold + sections, not headers |
| `<ul>/<ol>` lists | 1 | bullets are nearly absent from body_html |
| `<table>` | 59 (5 real key/value, rest 1-cell layout) | tables mostly carry marketing rows, not specs |
| `title_table`/`explain_table` marketing layout | 21 | heading + text rows with inline images |
| inline `<img>` in body_html | 35 | marketing images embedded in descriptions |
| empty body_html | 8 | nothing to import |
| variants > 1 (real options) | 165 | e.g. loupes: "Frame - White-Pink", "Headband"; furniture: wood colors |
| variant titles with `Option - Value` style | 36 | option name is recoverable from the title only |
| products with a positive USD price | 600 | priced in USD, currently imported quote-only with 0 |

---

## 2. What the current import degrades (per block above)

1. **Description is flattened.** `html_to_text` (uso_import_lib.py:306) strips every tag; bold lead-ins, section structure, marketing tables and inline images collapse into one wall of text. The PDP renders it as a single `<p>` (`productos/[slug]/page.tsx:100`).
2. **Specifications are always empty.** `uso_import.py:182` hard-codes `specifications=[]`. For most products the spec table is not even in body_html (it's rendered-page content), so extraction from the inventory alone covers only ~5 products.
3. **Cross-links dropped.** `body_html` carries curated links to categories, sibling models, buyer's guides and blogs (627 products); Theia stores none of it — the PDP has no related/sibling section at all.
4. **Options/variants dropped.** 165 products carry real options (frame colors, headband vs frame, wood finishes); the import takes only the first variant's price (0) and discards everything.
5. **Images**: files and array order are imported, but per-image alt text (in `products.json` alt fields) and position metadata are not; 106 products have no images at all (`uso_imageless.json`).
6. **Pricing**: 600 products have a positive USD price in the source; all are imported quote-only at 0/0 (per the owner's earlier decision — revisited below).
7. **227 products sit outside the menu** (`uso_uncategorized.json`), reachable only via `/productos` + search.
8. **Listing presentation**: `/productos` is a uniform card grid (ProductCard.tsx); USO's homepage leads with category tiles that carry **product counts** ("Exam Room Essentials — 45 products") plus a "Popular Picks" strip of type-badged rows — richer than a plain grid.

---

## 3. Decisions (first slice)

Recorded on issue #25 as comments; the four implementation slices in the ticket's acceptance criteria map to these.

### D1 — Description: keep one field, store sanitized structured HTML

- **Decision:** keep `Product.description` (Text) as the canonical plain-text (for listings/metadata/search), and **add `description_html` (Text)** holding a sanitized fragment of the source `body_html` restricted to an allowlist (`p, br, strong, em, b, i, h3, h4, ul, ol, li, a[rel=noopener]`; tables are *not* allowed — they become specs or are dropped). The PDP renders `description_html` with a tiny block renderer (no `dangerouslySetInnerHTML` on raw input; sanitize server-side at import time with a tested allowlist function in `uso_import_lib.py`).
- **Why:** the source's structure is bold lead-ins + sections, not semantic headings (630/661 `<strong>`, 4/661 `<h*>`, 1/661 lists) — a block/JSON model would be over-engineering; an allowlisted HTML fragment carries the same visual structure with far less new machinery.
- **What stays out:** `#iris-related` and `#iris-compare` blocks are *stripped from the description* and handled by D3 instead of rendering USO's copy (out of scope in #25: no wholesale copying of USO text).

### D2 — Specifications: parse body-html tables now; a rendered-page crawl is required for real coverage

- **Decision (slice b):** extract key/value pairs from genuine `td1_table`/`td2_table` tables and well-formed 2-column `<table>`s inside body_html into `Product.specifications` (`[{key, value}]`, current JSONB shape, no migration). Products with no key/value table keep `[]`.
- **Known limitation:** the ERK-770-grade spec tables (the ones the owner sees on USO) are **rendered-page content, not in `products.json`**. Full fidelity needs a follow-up one-time crawl of each product page (627 pages, reuse `fetch_with_backoff` + a `uso_specs.json` cache) to harvest the Specifications tab. That is its own ticket; slice (b) ships the parser + the body-html subset first.
- **Decision:** do **not** parse `title_table`/`explain_table` marketing rows into specs — they are prose sections (D1) with an inline image, not key/value data.

### D3 — Cross-links: model as data, not as imported copy

- **Decision:** strip `#iris-related`/`#iris-compare` from the imported description (D1) and instead extract the *links* into structured fields: `related_categories` (collection slugs), `related_products` (product slugs), `related_articles` (blog handles) as a `Product` JSONB column `cross_links`. The PDP renders a "Related" section from these when present.
- **Why:** USO's block text is vendor marketing copy ("Read our 2026 buyer's guide…"); Theia's buyer-guide content would be original Theia pages (out of scope here). Keeping the *links* as data preserves the navigation value without copying USO text.
- **Buyer-guide/blog pages themselves are out of scope** for #25 — the cross-link section renders only when the target exists in Theia.

### D4 — Variants/options: single quote-only product, options preserved as specs

- **Decision:** keep the single-product quote flow (no variant model this round). Import variant option values (deduplicated, e.g. "Frame - White-Pink, Frame - White-Green, …" or "Black, Dark Grey, Light Grey, White") as one or more `Product.specifications` rows under a canonical key ("Available options" / "Opciones disponibles") — respects CONTEXT.md's "Specification" definition (key/value technical detail) without inventing a variant entity.
- **Why:** the owner's quote-only flow (per #25 body) makes variants display-only today; the cost of a variants table outweighs its use until per-variant ordering exists. Revisit only if ordering per option is requested.

### D5 — Pricing: stays quote-only (owner decision, 2026-08-16)

- **Decision (owner):** keep the current quote-only display — do **not** import USD prices now. Imported products keep `price_gs`/`price_usd` at 0 and show only the quote CTA. Revisit later if the owner asks; the source prices are preserved in `uso_inventory.json` (600 products) so the decision is reversible without a re-crawl.

### D6 — Uncategorized products: leave out of the menu, reachable via catalog + search

- **Decision:** do not extend the curated menu (its integrity is a feature, and 227 long-tail items would bury the tree). Leave them reachable via `/productos` and site search. Revisit as a "Parts & accessories" section only if the owner sees the long-tail traffic in analytics.

### D7 — Listing presentation: modern design, no inherited phakos design

- **Design stance (owner-confirmed):** Theia's current storefront structure is a **carryover from phakos** (the original Svelte+DaisyUI site: emerald theme, carousel hero, "Lo Nuevo"/"Popular"/"Promociones" sections, image-top card grid with a price footer). That structure is not a requirement — it's an inheritance. The redesign must not follow phakos's design **or** USO's design. USO and phakos are *content/legacy* references only; the mapping in section 1 is a content map, not a design blueprint. The storefront gets its own modern design language.
- **Decision (slice d, prototype preview first):** design Theia's own listing presentation — decide the `/productos` layout on its own terms (card grid, list rows, or a mix), category tiles with product counts in a modern treatment, enriched cards (brand, availability), and a modern PDP (structured description D1, specs D2, related section D3, image metadata D8). A visual prototype is previewed by the owner before the redesign slice, per the card-grid objection in #25.

### D8 — Images: alt text + position metadata, hero from order

- **Decision:** add `image_alt` (array aligned with `images`) and treat array order as canonical display order, with index 0 = hero. Import Shopify's per-image `alt` fields (present in `products.json`) so alt text is never empty. Where USO's body_html embeds marketing images (35 products), those are **not** promoted into the gallery — they ride along in `description_html` only if the sanitizer keeps `img` (decide in slice a; default: strip, since they duplicate gallery shots).
- **Why:** image *positioning* in Theia is a storefront-design concern (D7), not a fidelity concern — the source's 40/60 split-table layouts are USO design, not content. What Theia must keep is the data: which images exist, in what order, with what alt. Product-count-ordered galleries and hero selection belong to the modern design, not to the import.
- **Image gap (106 imageless):** unchanged — per-vendor sourcing via `uso_imageless.json`, slice (c).

---

## 4. Implementation slice sketch (for the follow-up tickets)

- **(a) Structured description + image metadata**: `description_html` column + sanitizer allowlist in `uso_import_lib.py` + `image_alt` array + PDP renderer + backend Pydantic schema change + migration + tests (import unit tests + one E2E asserting bold lead-in renders).
- **(b) Specs extraction**: `extract_specifications(html) -> [{key, value}]` in `uso_import_lib.py` (pure function, table-driven, tested), wired into `uso_import.py`; optionally the `uso_specs.py` rendered-page crawl (separate ticket).
- **(c) Image gap**: per-vendor sourcing report already exists from #22/#23 (`uso_imageless.json`); the vendor-sourcing crawl is `/research`-shaped work — separate ticket.
- **(d) Modern PDP/list redesign**: new design language per D7 — no phakos carryover (hero carousel, sectioned card grids) and no USO mirroring; category tiles with counts, enriched cards, structured PDP sections per D1–D3, D8 — split into prototype-first and build tickets, prototype preview first.
- **Pricing (D5) is settled** (keep quote-only, no ticket); D6 (uncategorized) is decision-only, no ticket.

## Redactions / notes

- No tokens or keys. All quotes from usophthalmic.com pages are the source's own marketing copy, fetched 2026-08-16; Theia must not reproduce that copy wholesale (per #25 out-of-scope).
- The rendered-page Description-tab content (parallax rows) and the Specifications tab are **not crawlable via `/products.json`**; both are theme/metafield content. Any fidelity claim about them must come from a rendered-page crawl, not the inventory file.
