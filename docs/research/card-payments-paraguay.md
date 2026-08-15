# Card payment research (Paraguay)

- **Ticket:** #3 (parent spec: #1) — feeds ticket "Payments" (#12), which implements the card-payment provider adapter.
- **Date:** 2026-08-14
- **Scope:** Which card gateway Theia (Paraguayan ophthalmological-equipment dealer, FastAPI + Next.js storefront) should ship behind its card-payment adapter. Prices are stored in Gs and USD; buyers are professionals in Paraguay and abroad.
- **Method:** All provider facts were verified against primary sources (official sites, official developer docs/repos, official pricing pages) fetched on 2026-08-14. Secondary (news) sources are used only for market context and are marked as such. Anything not verifiable is explicitly marked **unverified**.

---

## Recommendation

**Ship Bancard vPOS 2.0 as the card gateway behind the adapter** (implementing ticket #12), with **upay (Pagopar, ueno bank) as the documented fallback** if Bancard's onboarding or terms don't fit.

Reasons:

1. **Bancard is the only true "card processor for Paraguay" of the candidates.** It is Paraguay's national payment-network operator: it processes Visa, Mastercard, Amex, Diners, JCB, Elo, Cabal and other brands, has >100,000 merchants, PCI DSS, and an e-commerce product (vPOS 2.0) that exists precisely for "sell in your app or website". In Paraguay, Visa/Mastercard transactions run through Bancard's network — there is no practical way to accept local cards in Gs without a local processor.
2. **vPOS fits the adapter contract directly**: server-to-server `create_single_buy` → `process_id` → hosted/embedded checkout (iframe, `bancard-checkout.js`, with `payment_url` hosted fallback) → status callback (`approved_url`/`cancelled_url`) + `get_charge_status` polling. Official Python connector exists (pip `bancardconnectorpython`), which matches the FastAPI backend.
3. **It supports what the store needs**: credit-card installments (**cuotas**), debit, prepaid, **international cards**, optional 3D Secure, pre-authorization, PYG settlement (debit credited online, credit in ~48 h), free merchant portal, sandbox environment.
4. **MercadoPago, Meru, UglyCash and Stripe are not viable card-acceptance options in Paraguay today** (see each section). MercadoPago has no PY operation (its `.py` domain redirects to MercadoLibre; not in its own developer-portal country list). Meru (getmeru.com) is a consumer global-USD wallet, not a gateway. UglyCash is a US-based consumer wallet/card issuer, not a merchant acquiring service. Stripe's official supported-country list does not include Paraguay. PayPal PY exists only as a personal-payments product (spec already handles PayPal as a separate, non-card gateway method).

**Adapter-contract notes for ticket #12** (verified details in the Bancard section below):

- Currency: **PYG only** per Bancard's official SDK ("currently the only allowed currency by Bancard"). Theia prices in USD must be converted at checkout (rate decision is Theia's).
- Settlement is in Gs to a local bank account (cuenta corriente/caja de ahorro) in the merchant's name.
- Model the adapter as: `create_payment(amount, currency, description, redirect_urls) -> process_id + payment_url`; then `confirm` on return; then `get_status`/rollback for reconciliation. Payment-method-specific params (installments, card tokenization via `catastro`) live behind the adapter interface.

---

## Comparison table

| Provider | Available to PY merchants? | Published merchant fees | Payment methods | Integration style | Sandbox | Onboarding | Notes |
|---|---|---|---|---|---|---|---|
| **Bancard vPOS 2.0** (Bancard S.A.) | ✅ Yes — national processor | Monthly plan price shown on page: Gs 74,900 IVA incl.; per-transaction commission **not published** (negotiated; news reports of a 3% cap — see Caveats) | Visa, Mastercard, Amex, Diners, JCB, Elo, Cabal, Maestro, prepaid, **cuotas (installments)**, Zimple wallet, debit; international cards; optional 3DS | API + embedded iframe (`bancard-checkout.js`) or hosted `payment_url`; official Python/JS/iOS connectors; merchant portal | ✅ `sandbox` env in official SDK | Cédula + RUC + local bank account (cuenta corriente/caja de ahorro) in merchant's name; sociedad docs if SA/SRL | Settlement: debit online, credit ~48 h; PYG only; 24/7; PCI DSS; free merchant portal |
| **upay / Pagopar** (ueno bank ecosystem) | ✅ Yes — PY fintech/bank | **Published:** débito 2%, crédito 2.9%, crédito intl. 3%, prepaga 2.9%/3%, QR 2%, QR Pix/Argentina 2.9% (excl. taxes) | Cards (local + international), QR (incl. Pix/Argentina), recurring (suscripciones) | API + plugins (WooCommerce, PrestaShop, Shopify, Wix); dev portal "API Documentation" | ⚠️ Dev portal exists; sandbox details unverified | ueno bank client required; RUC for pro features; Gs 0 (Base) / Gs 45,000/mo (Pro, 6 mo free) | Settlement 24 h (debit/QR) / 48 h (credit); antifraud; 35k+ merchants; strong fallback with transparent pricing |
| **MercadoPago** | ❌ **No PY operation found** — `.py` domain 301→mercadolibre.com; absent from its own dev-portal country list; no `developers.mercadopago.com.py` DNS | — | — | — | — | — | Runs in AR/BR/MX/CL/CO/PE/UY/EC only (per Wikipedia + own dev portal). Argentine-wallet QR payments at PY merchants are processed via PY's QR scheme (local acquirer), not by a "MercadoPago PY" |
| **Meru** (getmeru.com, R3mit Solutions) | ❌ No — consumer global-USD wallet/stablecoin API, not a merchant card gateway | — | Its own Visa card, QR to pay *at* merchants, crypto | API for stablecoin accounts/payouts | — | — | Ticket's "(Cooperativa/Meru SA)" identification could not be verified anywhere; only "Meru" found is the fintech (US company, Venezuelan cofounders). See section |
| **UglyCash** (Best Friend Finance, Inc.) | ❌ No — US-based consumer wallet + card issuer; no merchant acquiring | — | Own cards (up to 6% cashback), crypto, bank transfers | — | — | — | Not a payment-acceptance provider; ticket premise likely a misconception. See section |
| **Stripe** | ❌ No — Paraguay absent from official supported-country list | — | — | — | — | — | Also absent: rest of South America except Brazil & Mexico |
| **PayPal** | ⚠️ Partial — PY site is personal payments (send/request money). **Merchant/checkout availability for PY unverified**; PY president publicly promised "to bring PayPal to Paraguay", implying it is not fully available | — | — | — | — | — | Spec #1 already treats PayPal as its own gateway method (non-card) |

---

## Provider details

### 1. Bancard vPOS (Bancard S.A.) — recommended

**What it is.** Bancard S.A. is Paraguay's national payment-network operator/processor (not a card scheme): "Somos la red que acepta la mayor cantidad de marcas locales e internacionales", with Visa, Mastercard, American Express, Discover and JCB certifications, >100,000 POS installed, >4.5M cards processed, >100M monthly transactions, and >40 years of history (source: [bancard.com.py](https://www.bancard.com.py/)). Brands processed include Visa, Mastercard, Bancard Check, Credifielco, Discover, American Express, Diners Club, JCB, Elo, Credicard, Panal, Cabal, Maestro, Infonet and the Zimple wallet (source: [bancard.com.py — FAQ](https://www.bancard.com.py/soporte), quoted on the vPOS page).

**vPOS 2.0 product** ([bancard.com.py/vpos](https://www.bancard.com.py/vpos)) — "el botón de pago ideal para tu app o página web":

- Accepts credit cards **with cuotas (installments)**, debit, and Zimple wallet; possibility to accept **international cards**.
- Two payment modes: one-off (ocasional) and **catastro** (card-on-file: buyer registers a payment method once, later pays with one click).
- **Pre-authorization** solution (hold funds, debit on stock confirmation — relevant for a dealer with manual stock checks).
- Optional **3D Secure** ("Olvidate de los contracargos") — reduce chargebacks for online card sales.
- Embedded iframe, customizable colors/logos; **hosted `payment_url`** fallback (per SDK).
- "Planes en guaraníes con transacciones ilimitadas"; page displays **Gs 74,900 IVA incl.** next to the plan copy — read as the monthly plan price; **per-transaction commission is not published on the page** (confirm with Bancard; see Caveats for the reported 3% cap).
- **Settlement:** debit transactions credited online; credit transactions in 48 hours ("Acreditamos en línea tus ventas realizadas con tarjetas de débito y en 48 horas las realizadas con tarjeta de crédito").
- **Free merchant portal** (Portal de Comercios) with per-transaction detail, refunds (total/partial/reprocess), statements.
- **Security:** PCI DSS compliant; transactions encrypted; 24/7 support.
- **Onboarding requirements (published on the page):** Empresa Unipersonal — adhesion form, copy of Paraguayan cédula + RUC, cuenta corriente or caja de ahorro in the owner's name. Sociedad Anónima — form, cédulas of directors + RUC, authenticated statute + last assembly minutes, account in the society's name. SRL — form, cédulas + RUC, authenticated incorporation + powers, account in the society's name.

**API / integration (official sources):**

- Flow: call `create_single_buy` (charge token) → get `process_id` + `payment_url` → embed `bancard-checkout.js` (form with `process_id`) or redirect to `payment_url` → Bancard calls back `approved_url`/`cancelled_url` → reconcile with `get_charge_status` / rollback operations (sources: [Bancard/bancard-checkout-js README](https://github.com/Bancard/bancard-checkout-js), [Bancard/bancard-connectors — vpos/sdk/python README](https://github.com/Bancard/bancard-connectors/blob/master/vpos/sdk/python/README.md)).
- Card-on-file: `create_new_card_request` (catastro) → `alias_token`; debit alias-token payments require customer PIN confirmation via `Bancard.Confirmation.loadPinPad` (source: [bancard-checkout-js](https://github.com/Bancard/bancard-checkout-js)).
- **Official Python connector** on PyPI (`bancardconnectorpython`), configurable `environment=sandbox|production` via env vars (`BANCARD_ENVIRONMENT`, `BANCARD_PUBLIC_KEY`, `BANCARD_PRIVATE_KEY`) (source: [bancard-connectors README](https://github.com/Bancard/bancard-connectors/blob/master/vpos/sdk/python/README.md)) — directly usable by the FastAPI backend.
- **Currency: PYG only**, per the official SDK ("currency = 'PYG' # currently the only allowed currency by Bancard") (same source).
- Precondition: merchant must be registered/enabled by Bancard with access to the Portal de Comercios and the vPOS service (source: [bancard-checkout-js README](https://github.com/Bancard/bancard-checkout-js)).
- Sandbox: the SDK's `sandbox` environment (same source). Full API docs are distributed to enabled merchants via the Portal de Comercios; the public `developers.bancard.com.py` host does not resolve (checked 2026-08-14).

**Also on Bancard's network (context):** QR payments ("VentasQR" via the Infonet network / "QR — Pagos ágiles, sin contacto"), PIX acceptance (Brasil's scheme, via Bancard), Tokefon, Tpago, Infonet Cobranzas, factura electrónica from the POS (sources: [bancard.com.py](https://www.bancard.com.py/), [comercios.bancard.com.py](https://comercios.bancard.com.py/)).

### 2. upay / Pagopar (ueno bank) — recommended fallback

**What it is.** Pagopar, a long-standing Paraguayan payment gateway, is now part of **upay**, the acquiring/cobros platform of **ueno bank** (PY digital bank): "Pagopar ahora es parte de upay … con el respaldo de ueno bank" ([pagopar.com](https://www.pagopar.com/), [upay.com.py](https://upay.com.py/)). upay claims 35,000+ merchants and 24/7 support.

**Published pricing** (primary, on the product pages of [pagopar.com](https://www.pagopar.com/) and [upay.com.py](https://upay.com.py/); excludes tax retentions):

| Payment method | Fee | Settlement |
|---|---|---|
| Debit card | 2% | 24 business hours |
| Credit card (local) | 2.9% | 48 business hours |
| Credit card (international) | 3% | 48 business hours |
| Prepaid card | 2.9% (3% intl) | 48 business hours |
| QR (ueno / other PY entities) | 2% | 24 business hours |
| QR Pix / QR Argentina | 2.9% | 48 business hours |

Plans: **UPAY BASE Gs. 0** (app-based: QR, link de pago with RUC, uPOS) and **UPAY PRO Gs. 45,000/month** (first 6 months free; all QR incl. Pix; requires RUC + ueno bank account) ([upay.com.py](https://upay.com.py/)). Requirement: must be a ueno bank client.

**E-commerce/checkout product** (relevant for Theia): "Cobrá con medios de pago locales e internacionales desde tu e-commerce. Integración simple con API o plugins para WooCommerce, PrestaShop, Shopify y Wix. Contás con las mejores herramientas antifraudes para pagos con tarjetas" — plus recurring billing ("Suscripciones": automatic debit on local and international cards, retries, status notifications) (source: [pagopar.com](https://www.pagopar.com/) / [upay.com.py](https://upay.com.py/)). Developer portal at [desarrolladores.upay.com.py](https://desarrolladores.upay.com.py/) ("API Documentation"); its contents are behind a SPA/login — **sandbox/test availability unverified**.

**Verdict:** a credible, transparently-priced alternative to Bancard vPOS. Caveats: onboarding requires ueno bank account + (for pro/links) RUC; whether upay processes cards through Bancard's network or as an independent processor is **unverified**; no published cuotas/installment plan on the pages reviewed (only flat fees) — **cuotas availability unverified**.

### 3. MercadoPago — NOT available in Paraguay (verified absence)

- `www.mercadopago.com.py` (and `/ayuda`, `/vende`, `/cuotas`, `/developers/...`) all **301-redirect to `https://mercadolibre.com/`** (checked with curl on 2026-08-14). There is no PY-specific content.
- `developers.mercadopago.com.py` **does not resolve in DNS** (checked 2026-08-14); the global developer portal [developers.mercadopago.com](https://developers.mercadopago.com/) contains **no "Paraguay" entry** in its country set (Argentina, Brasil, Chile, Colombia, México, Perú, Uruguay, plus related locales).
- The PY-related news coverage is about *Argentine* wallets being accepted at *PY merchants* through PY's interoperable QR scheme (e.g., iProfesional/Xataka coverage of Argentine wallets abroad) — i.e., the acquiring still happens through local PY rails, not a "MercadoPago Paraguay" merchant account. **Theia merchants should not plan on MercadoPago for PY card acceptance.** (If MercadoPago ever launches a PY operation, re-evaluate behind the adapter.)

### 4. Meru — not a card gateway; "Meru (Cooperativa/Meru SA)" unverified

- The only "Meru" found in any source is the fintech at [getmeru.com](https://getmeru.com/): a **global USD/EUR account app** (US bank account, IBAN, Visa card, QR payments at merchants, crypto/DeFi, MoneyGram withdrawals) built by **R3mit Solutions Inc** (per its own LinkedIn) with Venezuelan cofounders — see [Infonegocios Paraguay (secondary)](https://infonegocios.com.py/conosur/meru-pone-la-mira-en-paraguay-con-pagos-transfronterizos-transferencias-y-servicios-para-empresas) reporting its Paraguay expansion plans. Its developer offering ([getmeru.com/developers](https://getmeru.com/developers)) is **stablecoin accounts, on/off-ramp, payroll and mass payouts** — not card acquiring/checkout.
- **"Meru S.A." as a Paraguayan card/QR operator or cooperative-network processor could not be verified in any official source** (searched official sites, news, archives). The ticket's parenthetical "(Cooperativa/Meru SA)" therefore appears to be a misattribution. Paraguay's interoperable **Pago QR** is a BCP (central bank) initiative operated through banks/cooperatives — news also references the **SIPAP** payment platform in that context ("BCP autorizó a procesadoras para operar pagos con Sipap", ABC Color — secondary). No "Meru" involvement was found.
- **Verdict:** exclude Meru from the card adapter. Its QR-acceptance angle (paying *at* merchants with the Meru app) is a consumer-side feature, not a gateway Theia could integrate for card payments.

### 5. UglyCash — not a merchant card-acceptance provider

- UglyCash is **Best Friend Finance, Inc., San Francisco, CA** — "a financial services platform, not a bank", "created in San Francisco, distributed worldwide" including South America ([ugly.cash](https://ugly.cash/), [legal.ugly.cash](https://legal.ugly.cash/)).
- It issues consumer **cards with up to 6% cashback**, crypto and bank transfers, and is regulated as a US MSB (FinCEN registrations), PCI DSS certified, SOC 2, ISO 27001, KYC via Sumsub ([legal.ugly.cash](https://legal.ugly.cash/)). Entities: BFF Prime/BFF United/BFF Classic (US), BFF Cards (Puerto Rico), plus Mexico and El Salvador registrations — **no Paraguay entity/license**.
- It offers no merchant acquiring/checkout API for e-commerce (nothing of the sort on its site or help center). **Verdict:** exclude from the adapter. The ticket premise (UglyCash as a card-payment candidate) could not be supported by any primary source; it is a consumer wallet, not a gateway. (If the ticket intended "a wallet buyers could use to pay", that's outside the card-gateway scope.)

### 6. Stripe — not available in Paraguay

- Stripe's official global-availability page ([stripe.com/global](https://stripe.com/global)) lists every supported country: **Paraguay is not among them**; in South America only **Brazil and Mexico** are supported. For businesses outside supported countries, Stripe explicitly says "Payments not supported yet" (only its stablecoin Treasury/Financial Accounts are accessible from 100+ countries).
- **Verdict:** exclude Stripe from the adapter for now.

### 7. PayPal (Paraguay) — context for the spec's separate gateway method

- PayPal operates a PY site ([paypal.com/py](https://www.paypal.com/py/home)) for **personal** payments: send money, request/receive payments, buyer protection — "Se requiere una cuenta para enviar y recibir pagos" (no public business/merchant-checkout landing for PY; `paypal.com/py/webapps/mpp/merchant` returns 404).
- Whether PayPal Business/Checkout merchant accounts are actually available to PY RUC holders is **unverified**. Notably, PY president Santiago Peña publicly promised "not to stop until PayPal comes to Paraguay", and local press covered a Bancard–PayPal dispute — implying full PayPal availability in PY is still pending (Última Hora / ABC Color / Diario Vanguardia headlines via Google News, 2026 — secondary).
- The spec (#1) already treats PayPal as its own payment method separate from the card adapter; no change needed here.

---

## Caveats and market context

- **Bancard is the gatekeeper for cards in Paraguay.** Visa/Mastercard acceptance in PY effectively requires Bancard's network (or a processor that connects to it). Regulatory attention: the competition authority (Conacom) sanctioned Bancard for abuse of dominance; a court case with Banco Continental is ongoing ("Sala Penal ratifica sanción a Bancard por monopolio", ABC Color; "Bancard: Corte revocó medida cautelar y procesadora deberá pagar multimillonaria multa", ABC Color — secondary). A new national payments law (SIPAP) is in legislative debate. Practical impact for Theia: Bancard onboarding is a manual commercial process (adhesion form + docs + RUC + bank account); plan the timeline accordingly, and keep the adapter swappable.
- **Merchant fees.** Bancard vPOS does not publish per-transaction commission on its site; news reports cover a **3% cap on card commissions** entering into force ("Bancard pone en vigencia el tope de 3% para comisiones", La Nación; "Entra en vigencia nuevo tope de comisiones por tarjetas", Última Hora — secondary, details unverified). upay publishes 2–3%. Ask Bancard for the written commission schedule during onboarding and confirm against the cap.
- **QR is the dominant electronic payment method in PY** — news: QR surpassed 13M monthly payments five years after launch, ~55% of electronic payments ("A cinco años de su llegada, el QR supera los 13 millones de pagos mensuales en Paraguay", InfoNegocios; "El método QR avanza y acapara el 55% de los pagos electrónicos", Última Hora — secondary). Card payments remain the standard for e-commerce and cuotas; the BCP-run interoperable QR is a BCP-regulated scheme operated through banks/cooperatives (BCP official page is bot-blocked; referenced via news — secondary).
- **Settlement currency.** Both viable gateways settle in **Gs** to a local account. Theia's USD prices require conversion at checkout (Fx rate source and rounding rules are Theia's decision; out of scope here).
- **Cuotas (installments):** supported by Bancard vPOS (credit cards with cuotas, plus plan-based re-processing for corrections). upay's reviewed pages show flat fees without an installment plan — **unverified**.
- **Test/sandbox:** Bancard official SDK exposes a sandbox environment. upay has a developer portal (contents behind login — unverified). MercadoPago/Stripe sandboxes are irrelevant in PY.

---

## Sources

**Primary (fetched 2026-08-14):**

1. Bancard — home: https://www.bancard.com.py/
2. Bancard — vPOS product page (features, cuotas, 3DS, settlement, onboarding requirements, brands): https://www.bancard.com.py/vpos
3. Bancard — official `bancard-checkout-js` (README: create_single_buy, create_new_card_request, alias_token, PIN pad): https://github.com/Bancard/bancard-checkout-js
4. Bancard — official `bancard-connectors` (vpos/sdk/python README: sandbox env, PYG-only, approved/cancelled URLs, get_charge_status): https://github.com/Bancard/bancard-connectors/blob/master/vpos/sdk/python/README.md
5. Bancard — Portal de Comercios (VentasQR etc.): https://comercios.bancard.com.py/
6. upay (ueno bank) — home (plans, fees, settlement, ueno requirement, RUC): https://upay.com.py/
7. Pagopar — home ("Pagopar ahora es parte de upay"; e-commerce API + plugins; published fee tables): https://www.pagopar.com/
8. upay — developer portal ("API Documentation"): https://desarrolladores.upay.com.py/
9. MercadoPago — global developer portal (country set, no Paraguay): https://developers.mercadopago.com/
10. MercadoPago PY — `https://www.mercadopago.com.py/` (301 → mercadolibre.com, verified via curl 2026-08-14); `developers.mercadopago.com.py` no DNS record
11. Stripe — global availability (official supported-country list; Paraguay absent; "Payments not supported yet"): https://stripe.com/global
12. PayPal PY — personal payments site: https://www.paypal.com/py/home (merchant landing `/webapps/mpp/merchant` → 404)
13. UglyCash — home (BFF Inc., San Francisco, cards, "we are not a bank"): https://ugly.cash/
14. UglyCash — legal & security (FinCEN registrations, PCI DSS, SOC 2, ISO 27001, entities, no PY): https://legal.ugly.cash/
15. Meru (getmeru.com) — home: https://getmeru.com/ ; developers: https://getmeru.com/developers

**Secondary (news/context, cited as such):**

16. InfoNegocios Paraguay — "Meru pone la mira en Paraguay con pagos transfronterizos…": https://infonegocios.com.py/conosur/meru-pone-la-mira-en-paraguay-con-pagos-transfronterizos-transferencias-y-servicios-para-empresas
17. Google News index (2026) — PY payments headlines: "A cinco años de su llegada, el QR supera los 13 millones de pagos mensuales en Paraguay" (InfoNegocios); "El método QR avanza y acapara el 55% de los pagos electrónicos" (Última Hora); "Bancard pone en vigencia el tope de 3% para comisiones" (La Nación); "Entra en vigencia nuevo tope de comisiones por tarjetas" (Última Hora); "BCP autorizó a procesadoras para operar pagos con Sipap" (ABC Color); "Santiago Peña promete 'no parar hasta traer PayPal a Paraguay'" (Última Hora); "Sala Penal ratifica sanción a Bancard por monopolio" (ABC Color); "Asesor de Bancard desmiente a Continental y niega bloqueo a Paypal" (Última Hora)

**Unverified items (explicit):** Bancard per-transaction commission % (not published); upay sandbox/test API details; upay card processing route (own processor vs. via Bancard); upay cuotas; PayPal Business availability for PY RUC holders; existence of a Paraguayan "Meru S.A." operator; MercadoPago historical/partial PY activity.
