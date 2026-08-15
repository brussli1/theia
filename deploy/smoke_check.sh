#!/usr/bin/env bash
# End-to-end smoke check for the production stack (#18).
# Run after `docker compose --env-file .env.production -f compose.prod.yaml up -d`.
# Usage: ./deploy/smoke_check.sh [BASE_URL]   (default: https://localhost)
set -euo pipefail

BASE_URL="${1:-https://localhost}"
COMPOSE=(docker compose --env-file .env.production -f compose.prod.yaml)
FAILED=0
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT

# The configured origin: sitemap/robots/canonical must match it, not just the
# probe URL — this catches SITE_URL wired wrong at build or runtime.
SITE_URL=$(grep -E '^SITE_URL=' .env.production | head -1 | sed 's/^SITE_URL=//' | tr -d ' "')
[ -n "$SITE_URL" ] || { echo "SITE_URL missing from .env.production" >&2; exit 1; }

# Caddy serves localhost over HTTPS with a locally-issued certificate, so
# curl needs -k there (and for bare-IP testing). Real domains verify normally.
host=${BASE_URL#*://}
host=${host%%/*}
case "$host" in
    localhost|127.0.0.1|[0-9]*)
        CURL_ARGS=(-k)
        ;;
    *)
        CURL_ARGS=()
        ;;
esac

check() {
    local label="$1" result="$2"
    if [ "$result" -eq 0 ]; then
        echo "PASS  $label"
    else
        echo "FAIL  $label"
        FAILED=1
    fi
}

http() { # label method path expected-status
    local label="$1" method="$2" path="$3" expected="$4"
    local status
    status=$(curl -sS "${CURL_ARGS[@]}" -o "$BODY" -w '%{http_code}' -X "$method" "${BASE_URL}${path}")
    if [ "$status" = "$expected" ]; then
        check "$label ($path -> $status)" 0
        return 0
    fi
    check "$label ($path -> $status, expected $expected)" 1
    return 1
}

echo "== Smoke check against $BASE_URL =="

# 1. All containers up and healthy.
ps_out=$("${COMPOSE[@]}" ps --format '{{.Service}} {{.State}} {{.Health}}')
for svc in postgres backend frontend caddy; do
    state=$(echo "$ps_out" | awk -v s="$svc" '$1 == s {print $2}')
    health=$(echo "$ps_out" | awk -v s="$svc" '$1 == s {print $3}')
    check "container $svc ($state/$health)" "$([ "$state" = "running" ] && [ "$health" = "healthy" ] && echo 0 || echo 1)"
done

# 2. Storefront reachable through the single entry point.
http "storefront home" GET "/" 200
grep -q "Theia" "$BODY" && check "home page renders brand" 0 || check "home page renders brand" 1

# 3. API through the proxy, including the database-backed health check.
http "api health" GET "/health" 200
grep -q '"status":"ok"' "$BODY" && check "api health is ok" 0 || check "api health is ok" 1
http "api categories" GET "/api/categories" 200
http "api products" GET "/api/products?page_size=1" 200

# 4. SEO surface served from the configured SITE_URL (not the probe URL).
http "sitemap" GET "/sitemap.xml" 200
grep -Fq "$SITE_URL" "$BODY" && check "sitemap uses SITE_URL" 0 || check "sitemap uses SITE_URL" 1
http "robots.txt" GET "/robots.txt" 200
grep -Fq "Sitemap: $SITE_URL/sitemap.xml" "$BODY" && check "robots points at SITE_URL sitemap" 0 || check "robots points at SITE_URL sitemap" 1
http "static page" GET "/soporte" 200
http "catalog page canonical" GET "/productos" 200
grep -Fq "rel=\"canonical\" href=\"$SITE_URL" "$BODY" && check "canonical URL uses SITE_URL" 0 || check "canonical URL uses SITE_URL" 1

# 5. Uploaded images persist: the media volume is mounted and writable.
if "${COMPOSE[@]}" exec -T backend sh -c 'touch media/.smoke && rm media/.smoke'; then
    check "media volume writable" 0
else
    check "media volume writable" 1
fi

# 6. Admin bootstrap + JWT signing round trip (requires JWT_SECRET and the
# ADMIN_* variables; production refuses to sign without them).
admin_email=$("${COMPOSE[@]}" exec -T backend sh -c 'echo $ADMIN_EMAIL')
admin_password=$("${COMPOSE[@]}" exec -T backend sh -c 'echo $ADMIN_PASSWORD')
if [ -n "$admin_email" ] && [ -n "$admin_password" ]; then
    token=$(curl -sS "${CURL_ARGS[@]}" -X POST "${BASE_URL}/api/auth/login" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$admin_email\",\"password\":\"$admin_password\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    if [ -n "$token" ]; then
        check "admin login issues token" 0
        me=$(curl -sS "${CURL_ARGS[@]}" -H "Authorization: Bearer $token" "${BASE_URL}/api/auth/me")
        echo "$me" | grep -q '"role":"admin"' && check "admin token has admin role" 0 || check "admin token has admin role" 1
    else
        check "admin login issues token" 1
    fi
else
    echo "SKIP  admin login (ADMIN_EMAIL/ADMIN_PASSWORD not set)"
fi

if [ "$FAILED" -eq 0 ]; then
    echo "== All smoke checks passed =="
else
    echo "== Smoke checks failed ==" >&2
    exit 1
fi
