# Production deployment (#18)

Brings the storefront, API, database and reverse proxy up on a clean machine
with one command. The stack is defined in `compose.prod.yaml`; this guide
covers setup from scratch. Decisions and rationale: `docs/adr/0005-deploy.md`.

## Topology

```
Internet ──> Caddy (80/443, auto TLS) ──┬─> /api/*  /media/*  /docs*  → backend:8000
                                        │
                                        └─> everything else             → frontend:3000
```

One public origin serves the storefront, the API and uploaded images, so
canonical/OG URLs (`SITE_URL`) and image URLs (`MEDIA_URL`) are same-origin.
Postgres, backend and frontend publish no ports to the host — only Caddy does.

## Prerequisites

- A Linux VPS with Docker Engine and the Compose plugin
  (`docker --version` and `docker compose version` must work; on Ubuntu:
  `apt install docker.io docker-compose-v2` or the official convenience
  script).
- A domain with an `A` record pointing at the server (Caddy provisions TLS
  automatically). For bring-up/testing without a domain: `DOMAIN=localhost`
  serves over HTTPS with a locally-issued certificate (`curl -k` or a browser
  warning), a bare IP serves plain HTTP.
- Open firewall ports 80 and 443.

## 1. Get the code

```bash
git clone https://github.com/brussli1/theia.git
cd theia
```

## 2. Configure

```bash
cp .env.production.example .env.production
```

Fill in `.env.production` (gitignored — never commit it):

| Variable | Meaning |
|---|---|
| `DOMAIN` | Public origin without scheme, e.g. `theia.example.com` |
| `POSTGRES_PASSWORD` | Postgres password; generate one |
| `JWT_SECRET` | Session signing secret; **production refuses to start signing without it** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstraps the admin account at startup; rotate by changing + restarting |
| `PAYMENT_MODE` | `sandbox` (simulated gateways, works out of the box) → `production` once gateway keys exist |
| `BANCARD_*`, `PAYPAL_*` | Gateway keys — see ADR 0001 |
| `SMTP_*`, `WHATSAPP_*` | Quote-notification channels — see ADR 0002 |
| `SITE_URL` | The single origin knob — `https://<DOMAIN>`; the backend's gateway-return and media URLs are derived from it |

Generate secrets:

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # JWT_SECRET
```

Changing `DOMAIN` later means updating `DOMAIN` and `SITE_URL` and rebuilding
the frontend (`robots.txt` is baked at image build time).

The `BANCARD_*` / `PAYPAL_*` keys, `SMTP_*` and `WHATSAPP_*` credentials are
optional until the corresponding channel goes live; with `PAYMENT_MODE=sandbox`
and no notification credentials the whole flow works end to end with
simulated payments and logged notifications.

## 3. Start

```bash
docker compose --env-file .env.production -f compose.prod.yaml build
docker compose --env-file .env.production -f compose.prod.yaml up -d
```

(A root `Makefile` wraps this invocation: `make build`, `make up`, `make logs`,
`make ps`, `make smoke`, `make down`.)

- Migrations run automatically at backend container start (`alembic upgrade
  head`).
- Uploaded product images persist on the `media_data` volume; the database on
  `postgres_data`.

## 4. Verify

```bash
docker compose --env-file .env.production -f compose.prod.yaml ps   # all healthy
./deploy/smoke_check.sh                                              # end-to-end checks
```

`deploy/smoke_check.sh` verifies, through the entry point: container health,
the storefront, `/health` (database included), catalog endpoints, the
sitemap/robots/canonical URLs (checked against the configured `SITE_URL`),
a writable media volume, and an admin login that returns an `admin`-role
token (proving `JWT_SECRET` signing and admin bootstrap). With `DOMAIN=localhost`
run it as `./deploy/smoke_check.sh https://localhost`.

Manual spot checks:

```bash
curl -I https://<DOMAIN>/
curl https://<DOMAIN>/health
curl https://<DOMAIN>/sitemap.xml
```

Then in a browser: browse the catalog, log in at `/admin`, upload a product
image and confirm it renders, and run a checkout through the sandbox payment
flow (`PAYMENT_MODE=sandbox` sends the customer straight back to the
confirmation page, marked paid).

The demo catalog is not seeded in production. If you want the demo data
(e.g. to try the storefront before entering real products):

```bash
docker compose --env-file .env.production -f compose.prod.yaml exec backend python -m scripts.seed_demo
```

## Operations

**Logs:** `docker compose --env-file .env.production -f compose.prod.yaml logs -f backend`

**Update:** pull, rebuild, restart — migrations run on boot:

```bash
git pull
docker compose --env-file .env.production -f compose.prod.yaml build
docker compose --env-file .env.production -f compose.prod.yaml up -d
```

**Backups:** the database and the media volume are the state. For example,
nightly:

```bash
docker compose --env-file .env.production -f compose.prod.yaml exec -T postgres \
  pg_dump -U theia theia | gzip > theia-$(date +%F).sql.gz
docker run --rm -v theia-prod_media_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/theia-media-$(date +%F).tar.gz -C /data .
```

Restore: `gunzip -c theia-*.sql.gz | docker compose ... exec -T postgres psql -U theia theia`
and untar the media archive into the volume.

**Secrets rotation:** restarting the backend with a new `ADMIN_PASSWORD`
re-hashes the admin account (id unchanged); a new `JWT_SECRET` invalidates
every existing session token.

## Going live checklist

1. **Payments:** complete Bancard Portal de Comercios onboarding (vPOS),
   create the PayPal REST app, set the four gateway keys and flip
   `PAYMENT_MODE=production` — see `docs/adr/0001-payments.md` for the wire
   contracts that must be re-verified against the portal.
2. **Notifications:** provide SMTP credentials, and/or WhatsApp Business API
   credentials — see `docs/adr/0002-quotes.md`. **First-contact quote leads
   need a pre-approved WhatsApp template** (free text only works inside the
   24-hour window after a customer writes first); decide the template or ship
   the confirmation-page links only.
3. **Verify the OG images** on a product page after going live: the backend
   returns absolute image URLs from `MEDIA_URL`, so they must point at the
   production origin.
4. Re-run `./deploy/smoke_check.sh` with `PAYMENT_MODE=production` — the
   admin-login check still must pass.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `docker compose ... config` fails with "required variable is not set" | A mandatory variable (e.g. `JWT_SECRET`, `POSTGRES_PASSWORD`, `DOMAIN`) is missing from `.env.production` |
| Backend container restarts in a loop | Database unreachable or migration failed — `docker compose ... logs backend` |
| Storefront 502s | Frontend still booting (first request compiles) or crashed — `logs frontend` |
| Admin login says invalid credentials | `ADMIN_EMAIL`/`ADMIN_PASSWORD` not set when the backend started (bootstrap runs at startup) — set them and restart |
| Certificate issues | Caddy auto-provisions on first request for real domains; check DNS `A` record and that ports 80/443 are reachable |
| Image uploads vanish after restart | `media_data` volume missing from the compose file — never edit it away |
