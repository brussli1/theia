# Production deployment

One server runs everything with Docker Compose (`compose.prod.yaml`):

```
Internet ──> Caddy (80/443, automatic HTTPS) ──> app (Next.js + Payload, :3000) ──> db (Postgres)
                                                  └─ images on the host: ./storage/media
```

Only Caddy publishes ports. Pending database migrations run automatically when the app starts. Without `SMTP_HOST`, e-mails are written to the app log instead of sent.

The current **private client demo is self-hosted** on the development machine and published with Tailscale Funnel, at no cost: see *Self-hosting* at the end. Sections 1–5 cover a real server (a small Hetzner Cloud server with a free DuckDNS subdomain, or any Ubuntu VPS) for when the demo needs to be always on. (Oracle Cloud's free tier was tried first, but it had no capacity.)

## 1. Server (Hetzner Cloud)

1. Create an account at console.hetzner.cloud and a project.
2. **Add Server:**
   - Location: any EU site for Arm (Falkenstein, Nuremberg, Helsinki).
   - Image: **Ubuntu 24.04**.
   - Type: **Shared vCPU → Arm64 (Ampere) → CAX11** (2 vCPU, 4 GB). CAX21 (8 GB) gives more headroom.
   - Networking: public IPv4 on (DuckDNS needs IPv4).
   - SSH key: paste the public key (`~/.ssh/oracle-theia.key.pub` on the development machine). No root password is set, so SSH keys are the only way in.
   - Note the server's IPv4 address. The login user is `root`.
3. Ports are open by default. Optionally add a Hetzner **Firewall** allowing only TCP 22, 80 and 443.
4. Over SSH (`ssh -i ~/.ssh/oracle-theia.key root@<ip>`), install Docker and add swap. 4 GB is tight for `next build`:

   ```bash
   apt-get update && apt-get -y upgrade
   curl -fsSL https://get.docker.com | sh
   fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

## 2. Domain (DuckDNS)

Sign in at duckdns.org, create a subdomain (e.g. `theia-demo`), and set its IP to the VM's public IP. The site will be `https://theia-demo.duckdns.org`. To switch to the client's domain later, point an `A` record at the same IP and change `DOMAIN` / `NEXT_PUBLIC_SERVER_URL`.

## 3. App

```bash
git clone https://github.com/brussli1/theia.git && cd theia
git checkout rebuild            # until it is merged into master
cp .env.example .env.production
```

Fill in `.env.production`. Generate secrets with `openssl rand -hex 32`.

| Variable | Demo value |
|---|---|
| `DOMAIN` | `theia-demo.duckdns.org` |
| `NEXT_PUBLIC_SERVER_URL` | `https://theia-demo.duckdns.org` |
| `POSTGRES_PASSWORD`, `PAYLOAD_SECRET`, `PREVIEW_SECRET` | random secrets |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first admin, created on first start |
| `PAYMENT_MODE` | `sandbox` (no real charges) |
| `SITE_NOINDEX` | `true` (hidden from search engines) |

Leave `DATABASE_URL` as is; compose builds it from `POSTGRES_PASSWORD`. Then lock the file down: `chmod 600 .env.production`.

## 4. Data (catalog + images)

The demo data is a bundle built on the development machine in `deploy-bundle/` (gitignored):
- `theia_demo.dump` — database with the imported catalog and seeded content, no users
- `media.tgz` — images, ~630 MB

Copy it up and restore it before the first start:

```bash
# from the development machine
scp -i ~/.ssh/oracle-theia.key deploy-bundle/theia_demo.dump deploy-bundle/media.tgz root@<server-ip>:~/theia/

# on the server, in ~/theia
mkdir -p storage && tar -xzf media.tgz -C storage && chown -R 1001:1001 storage/media
C="docker compose -f compose.prod.yaml --env-file .env.production"
$C up -d db
$C exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' < theia_demo.dump
rm theia_demo.dump media.tgz
```

Without the bundle the app still starts with an empty catalog: migrations create the tables, and content can be added in `/admin`.

## 5. Start

```bash
$C up -d --build      # the first build takes a few minutes
$C logs -f app        # wait for "Ready"
```

Open `https://<DOMAIN>`, sign in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and check that `/robots.txt` says `Disallow: /`.

## Updating

```bash
git pull
$C up -d --build      # new migrations run on startup
```

After changing a collection, generate a migration in development (`npm run payload migrate:create <name>`) and commit it. Production never auto-pushes the schema.

## Backups

```bash
$C exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > backup-$(date +%F).dump
tar -czf media-$(date +%F).tgz -C storage media
```

Keep copies off the server. Hetzner's paid backups (+20% of the server price) also snapshot the whole server daily.

## Rebuilding the demo bundle

On the development machine, with the dev Postgres running (`docker compose up -d`):

1. `create database theia_demo`. Set `DATABASE_URL` to it, `NODE_ENV=production` (so Payload uses migrations, not schema push), and `MEDIA_DIR` to an empty folder.
2. `npm run payload migrate`.
3. Move `legacy-data/import-state.json` aside: it maps images to the dev database's IDs. Then run `npm run import:legacy` (~10 min) and `npm run seed`. Put the original state file back afterwards.
4. `delete from users` (so the server creates its own admin), then `pg_dump -Fc --no-owner` and tar the media folder into `deploy-bundle/`.

## Going live later

- Set `SITE_NOINDEX=false` and use the client's domain.
- Configure SMTP (`SMTP_*`), so quote and order notifications reach the store; also set the notification address in **Ajustes**.
- For real card or PayPal payments: add the gateway keys and set `PAYMENT_MODE=production`. Methods without keys are hidden automatically; transfer and Western Union always work.

## Self-hosting (Tailscale Funnel)

Runs the same production stack on the development machine (WSL + Docker). Caddy is replaced by **Tailscale Funnel**, which gives a fixed public HTTPS address (`https://<machine>.<tailnet>.ts.net`) and needs no router setup. `compose.selfhost.yaml` publishes the app on `127.0.0.1:3100` and leaves Caddy off.

Current demo: **https://simbiosi-1.tail8091a.ts.net** (Docker project `theia-demo`, WSL Tailscale node `simbiosi-1`).

```bash
C="docker compose -p theia-demo -f compose.prod.yaml -f compose.selfhost.yaml --env-file .env.production"
```

First time:
1. Write `.env.production` as in section 3, with `DOMAIN=<machine>.<tailnet>.ts.net`, `NEXT_PUBLIC_SERVER_URL=https://$DOMAIN`, `SITE_NOINDEX=true` and `PAYMENT_MODE=sandbox`.
2. Restore the data as in section 4, but locally. Unpack `deploy-bundle/media.tgz` into `storage/`, then fix ownership without sudo:

   ```bash
   docker run --rm -v "$PWD/storage/media:/m" alpine chown -R 1001:1001 /m
   ```

   Then `$C up -d db` and run `pg_restore` with the dump.
3. `$C up -d --build`, then check `http://127.0.0.1:3100`.
4. Publish it from the **WSL** shell, the node whose name is in `DOMAIN`: `sudo tailscale funnel --bg 3100`.
   - The first time, Tailscale may print a link to enable Funnel for the tailnet; open it, approve, and rerun.
   - `tailscale funnel status` should list `https://<DOMAIN> (Funnel on)`.
   - `sudo tailscale funnel --https=443 off` takes it offline.
   - Testing the URL from a tailnet device reaches it privately; test from a phone on mobile data to see what the client sees.

Day to day:
- The link works only while this PC is **on and awake**, with WSL and Docker running. The containers restart by themselves when Docker starts, and the Funnel setting survives reboots. Disable Windows sleep while the client is reviewing.
- To update after code changes, run `git pull` (or work locally), then `$C up -d --build`.
- Page and image speed is limited by the home upload bandwidth.
- Moving to a server later: back up with the commands under *Backups* (using `$C`), and restore on the server.
