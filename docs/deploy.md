# Production deployment

One server runs everything with Docker Compose (`compose.prod.yaml`):

```
Internet ──> Caddy (80/443, automatic HTTPS) ──> app (Next.js + Payload, :3000) ──> db (Postgres)
                                                  └─ images on the host: ./storage/media
```

Only Caddy publishes ports. Pending database migrations run automatically when the app starts. Without `SMTP_HOST`, e-mails are written to the app log instead of sent.

The current target is a **private client demo** on an Oracle Cloud Always Free VM with a free DuckDNS subdomain. The same steps work on any Ubuntu VPS.

## 1. Server (Oracle Cloud Always Free)

1. Create an Oracle Cloud account. It needs a card for verification; Always Free resources are not charged.
2. **Compute → Instances → Create instance:** Ubuntu 24.04, shape **VM.Standard.A1.Flex** (Arm, Always Free). Give it as many OCPUs / GB as the free allowance shows (2 OCPU / 12 GB is plenty), add your SSH public key, and keep the public IP.
   - If you get "out of capacity", try another availability domain or retry later.
3. **Networking → the instance's VCN → Security list → Add ingress rules:** TCP 80 and TCP 443 from `0.0.0.0/0`.
4. Oracle's Ubuntu images also block ports in the VM's own firewall. Over SSH, run:

   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

5. Install Docker:

   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER   # log out and back in
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
scp deploy-bundle/theia_demo.dump deploy-bundle/media.tgz ubuntu@<server-ip>:~/theia/

# on the server, in ~/theia
mkdir -p storage && tar -xzf media.tgz -C storage && sudo chown -R 1001:1001 storage/media
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

Keep copies off the server: free Oracle VMs can be reclaimed if idle.

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
