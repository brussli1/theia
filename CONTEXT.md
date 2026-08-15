# Theia

E-commerce catalog and storefront for ophthalmological equipment, sold to professionals in Paraguay and abroad.

## Language

**Customer**:
A professional buyer — ophthalmologist, optometrist, clinic, or equipment distributor.
_Avoid_: client, buyer, user

**Product**:
A new item of ophthalmological equipment or consumable offered for sale in the catalog.
_Avoid_: item, article, listing, SKU

**Orderable product**:
A Product that can be added to a cart and purchased online.
_Avoid_: cartable, sellable, in-stock

**Quote-only product**:
A Product that cannot be purchased online; the buyer requests a quote instead.
_Avoid_: enquiry-only, contact-only, on-request

**Used equipment**:
Previously owned equipment, offered only through direct contact — not a catalog Product.

**Rental**:
Temporary equipment hire, offered only through direct contact — not a catalog Product.

**Category**:
A grouping of Products, nestable.
_Avoid_: department, section

**Brand**:
The manufacturer a Product comes from (e.g. Huvitz, Kowa).
_Avoid_: make, label

**Price**:
The monetary amount of a Product, stored in both Guaraní (₲) and US dollars ($). A Product has a single price — no sale/discount pricing.
_Avoid_: cost, value, amount

**Currency**:
Which Price is shown — Guaraní for visitors in Paraguay, US dollars elsewhere — determined by the visitor's location.

**Availability**:
Whether a Product can currently be bought, as a flag (available / unavailable). There is no stock count.
_Avoid_: stock, inventory, quantity

**Certification**:
A medical-compliance mark on a Product (FDA, CE, ISO), shown as a badge and usable as a catalog filter.
_Avoid_: compliance, standard, approval

**Specification**:
A key/value technical detail of a Product (e.g. "Magnification: 10x–16x").
_Avoid_: attribute, property, field

**Collection**:
A curated list of Products for a homepage section ("Popular", "Promociones"); "Lo Nuevo" is the newest Products, automatic.
_Avoid_: group, bucket, carousel

**Cart**:
A buyer's in-progress selection of orderable Products.
_Avoid_: basket, bag

**User**:
A customer's registered identity — an email and password — used to see their Order and QuoteRequest history. Guest checkout remains available without one, and orders/quote requests are linked to the User that created them. Colloquially an "account" (the account page is `/cuenta`).
_Avoid_: profile, login (as a noun)

**Admin**:
A User with the admin role — the only identity that may use the admin panel (`/admin`). Registration can never grant the role; the configured `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap does.
_Avoid_: operator, staff, moderator

**Order**:
A buyer's completed purchase of orderable Products. Its status runs `awaiting_payment` → `paid` (gateway confirmation, or an admin confirming a manual transfer) → `shipped` → `delivered`; `received` is a legacy pre-payment status.
_Avoid_: purchase, transaction, sale

**Payment**:
The record of how a buyer pays for an Order — method (PayPal, Western Union, or card), status (pending / paid), and amount — charged in guaraníes by default, gateway-backed behind a provider adapter. Western Union is confirmed manually, by an admin marking the Order `paid`.
_Avoid_: charge, transaction, settlement

**Quote**:
A buyer's request for pricing or availability — for a quote-only Product, Used equipment, or a Rental.
_Avoid_: enquiry, contact, RFQ

**QuoteRequest**:
The stored record of a Quote — contact details, kind (`product` | `used` | `rental`), an optional message, the quoted Product's snapshot, and a status (`new` → `responded` → `closed`, moved by an admin).
_Avoid_: lead, inquiry, ticket
