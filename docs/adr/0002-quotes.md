# ADR 0002: Quote requests are stored, then notified to Theia through per-channel adapters

- **Status:** accepted (2026-08-15)
- **Ticket:** #13 Quotes (parent spec: #1, stories 19–23)
- **Context:** the PRD unifies three contact paths — quote-only product, used equipment, rental — into one quote flow (stories 19–21), each request must reach Theia by WhatsApp and email (story 22), and be stored so Theia can follow up (story 23). There was no notification infrastructure: no SMTP, no WhatsApp credentials, and the repo ships no secrets. The payments work (#12) established the pattern this decision mirrors: a seam with a sandbox default, wired by configuration in production.

## Decision

1. **A quote request is a stored entity.** `quote_requests` rows snapshot the contact details (name, email, phone), the kind (`product` | `used` | `rental`), an optional message, and — for product quotes — the product's name and id (snapshot, like `order_items`), so requests survive catalog changes. Requests carry a human-friendly reference (`QT-XXXXXXXX`) and start `new`; responding/working them is admin territory (#16). Lookup is by reference + the email used to submit, mirroring order lookup (#11); per-account history arrives with #14.
2. **Only quote-only products can be quoted.** A product quote requires a slug; the product must exist and must not be orderable (orderable products belong in the cart). Enforced in the API, not just the UI.
3. **Notification runs after the request is persisted, best-effort per channel.** `POST /api/quotes` commits the request first; then `app/notifications.notify_quote` delivers to each configured channel as a background task, after the response. A failing channel is logged, never fatal — the stored request is the point, and the confirmation page offers the customer direct `wa.me`/`mailto:` links (with the reference prefilled) as the fallback delivery path.
4. **Channels are small adapters behind a Protocol, enabled by their credentials.** `EmailNotifier` sends via SMTP (enabled by `smtp_host`; recipient `notification_email_to`, default td.phakos@gmail.com) and `WhatsAppNotifier` sends a text via the Meta Cloud API (enabled by `whatsapp_token` + `whatsapp_phone_id`; recipient `notification_whatsapp_to`, default 595971282908). With nothing configured (dev/test/CI) no channel is registered and the composed message is logged instead, so the flow is still exercised end-to-end without credentials. Messages are composed in Spanish — Theia's business language — from one source (`app/notifications/messages.py`). Both adapters are unit-tested at the transport boundary (injected smtp client / httpx mocked transport), the same seam the payment providers use.
5. **Credentials stay out of the repo.** `smtp_password`, `whatsapp_token`, etc. are empty by default and must stay that way, like the gateway keys.

## Consequences

- Every quote request is stored even when no notification channel is configured; nothing is lost in dev.
- Notifications are fire-and-forget background tasks: if SMTP or WhatsApp is down, the request survives and the customer can still reach Theia through the confirmation-page links. Automated retry is out of scope.
- The WhatsApp leg sends free-form text, which the Meta Cloud API only accepts for business-initiated messages through **pre-approved templates** (free text works inside a 24-hour window after the customer messages Theia first). Sending a template (or the fallback links only) is an onboarding decision for when real credentials exist.
- The notification text is plain text, Spanish-only, shared by both channels; per-locale or templated messages would extend `messages.py`.
- Admin (#16) extends the quote status vocabulary beyond `new` and works the stored requests.
