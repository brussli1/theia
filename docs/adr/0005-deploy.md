# ADR 0005: Production runs as one compose stack behind a single public origin

- **Status:** accepted (2026-08-15)
- **Ticket:** #18 Production deploy (parent spec: #1)
- **Context:** the stack — FastAPI backend, Next.js 14 storefront, Postgres —
  had a dev compose (`compose.yaml`) but no production story: no TLS, no
  secrets handling, no persistent home for uploaded images (a consequence
  left open by ADR 0004), and no way to bring the whole thing up from a clean
  machine. The storefront calls the API server-side over `BACKEND_URL`, and
  metadata/sitemap/robots (from #17) need a public origin (`SITE_URL`), so the
  deployed topology must decide how origins line up.

## Decision

1. **One compose file, one public entry point.** `compose.prod.yaml` runs
   Postgres, backend, frontend and a Caddy reverse proxy; only Caddy publishes
   host ports (80/443). The proxy routes `/api/*`, `/media/*`, `/docs` and
   `/openapi.json` to the backend and everything else to the storefront, so
   the    browser, the API and uploaded images all share one origin — `SITE_URL`
   is the single knob, and `MEDIA_URL` and `FRONTEND_URL` are derived from it
   in compose. Caddy serves plain HTTP for bare IPs and provisions Let's
   Encrypt TLS automatically for real domains (`localhost` gets HTTPS with a
   locally-issued certificate).
2. **Secrets and config come from the environment.** A single gitignored
   `.env.production` (template: `.env.production.example`, committed with
   empty values) is passed to compose with `--env-file`. Backend database URLs
   are derived in compose from `POSTGRES_PASSWORD`; every credential
   (`JWT_SECRET`, gateway keys, SMTP/WhatsApp, `ADMIN_*`) flows from the env
   file to the container. `ENVIRONMENT` is hardcoded `production` in the
   production compose — the stack cannot accidentally boot in development
   mode (where a fixed JWT secret signs tokens).
3. **State lives on named volumes.** `postgres_data` for the database,
   `media_data` for uploaded product images (resolving ADR 0004's open
   consequence — no object storage for now), `caddy_data`/`caddy_config` for
   certificates. Backend and frontend are stateless containers.
4. **Migrations run at backend container start** (`alembic upgrade head`
   before uvicorn), so updating is pull → rebuild → `up -d`; there is no
   separate migrate step.
5. **Deploy verification is a script, not folklore.** `deploy/smoke_check.sh`
   exercises the stack through the entry point: container health, storefront,
   database-backed `/health`, catalog endpoints, sitemap/robots/canonical
   URLs checked against the configured `SITE_URL`, media volume writability,
   and an admin login that returns an `admin`-role token (proving `JWT_SECRET`
   signing and bootstrap in production mode).

## Consequences

- Only two ports are ever open (80/443); backend and frontend are unreachable
  except through the proxy.
- The demo catalog is not seeded in production; seeding is an explicit
  `docker compose exec backend python -m scripts.seed_demo`.
- A domain change requires updating `.env.production` (`DOMAIN`, `SITE_URL`)
  and **rebuilding the frontend**: `SITE_URL` is a build arg because
  `robots.txt` is generated at image build time (the storefront's pages read
  it at runtime — they are all dynamic via the `lang` cookie). TLS
  re-provisions on the next request.
- `compose.prod.yaml` requires `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_*`,
  `DOMAIN` and the three URL variables to be set — misconfiguration fails
  loudly at `docker compose config` time instead of at runtime.
- Production payment/notification channels still need real credentials
  (ADR 0001 gateway onboarding, ADR 0002 SMTP/WhatsApp) — the compose file
  only carries the keys through; the WhatsApp first-contact template decision
  remains open.
