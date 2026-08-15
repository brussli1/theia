# ADR 0001: Payments run behind a swappable provider adapter; charge currency is configurable

- **Status:** accepted (2026-08-15)
- **Ticket:** #12 Payments (parent spec: #1, stories 15/18)
- **Context:** checkout (from #11) created orders with no payment method. #12 adds payment-method selection (PayPal, Western Union, card). Research (`docs/research/card-payments-paraguay.md`) concluded Bancard vPOS 2.0 is the only viable card processor in Paraguay (PYG settlement only), with upay/Pagopar as fallback; PayPal in PY exists only as personal payments.

## Decision

1. **Every order records a payment method and a payment.** `orders.payment_method` snapshots the method; a `payments` row per order records method, status (`pending` → `paid`), our charge reference (`shop_process_id` = order number, unique — doubles as Bancard's marketplace id), the gateway-side `gateway_reference` (Bancard process_id / PayPal order id; none for Western Union), and the charged amount + currency.
2. **Order status vocabulary:** every new order starts `awaiting_payment`; it becomes `paid` when the gateway confirms the payment. `received` is kept as a legacy status for pre-#12 orders.
3. **Gateway code sits behind a provider adapter** (`app/payments/`): `PaymentProvider.create_payment(...) -> PaymentIntent(reference, redirect_url)` and `PaymentProvider.confirm(payment) -> bool`. Providers are selected by the `payment_mode` setting:
   - `sandbox` (default; dev/test/CI) — a simulated gateway: the customer is sent straight to the return URL and every confirmation succeeds, so the whole loop runs without merchant accounts.
   - `production` — Bancard vPOS for cards, PayPal REST v2 for PayPal. Both clients implement the wire contracts verified against official sources (Bancard connector, PayPal public API) and are exercised in tests with a mocked transport; exact Bancard API details must be re-verified with the Portal de Comercios during onboarding.
4. **The charge currency is per gateway, driven by what each gateway supports.** The order already snapshots both amounts (`subtotal_gs`, `subtotal_usd`), so no FX lookup is needed: cards (Bancard vPOS) charge the PYG amount, PayPal charges the USD amount (PayPal REST does not support PYG), and Western Union is quoted in Gs, matching the local account. The Gs/USD relationship is whatever the seller priced the products at.
5. **Confirmation flow:** the customer pays at the gateway's hosted page and the browser returns to `/pedido/{order_number}?payment_ref=...`; the page calls `POST /api/payments/confirm`, which asks the provider (Bancard confirmations web service / PayPal capture) and flips payment + order to `paid`. Confirming is idempotent — an already-paid payment is never charged again.

## Consequences

- Each payment record snapshots the amount and currency actually charged (PYG for card/Western Union, USD for PayPal). The confirmation page renders that amount and currency.
- Western Union is manual: the order waits for payment until an admin confirms the transfer (admin order handling is a later ticket, #30/#15).
- The sandbox gateway must never be used in production: `payment_mode=production` requires real keys, and the environment (URLs, PayPal API base) follows `payment_mode`.
- Cancellations/rollbacks (Bancard rollback, PayPal void) are out of scope until a fulfilment/admin flow exists; an intent orphaned by a losing concurrent checkout is left dangling until then.
