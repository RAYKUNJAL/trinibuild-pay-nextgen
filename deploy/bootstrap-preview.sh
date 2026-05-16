#!/usr/bin/env bash
# Deploy WeFetePass preview beside the live site on the RNR/Caddy Docker server.
# Run as root. Safe to re-run: it fetches, rebuilds, restarts, and smoke-tests.

set -euo pipefail

REPO_URL="${1:-git@github.com:RAYKUNJAL/trinibuild-pay-nextgen.git}"
BRANCH="${2:-main}"
DEPLOY_KEY="${DEPLOY_KEY:-/root/.ssh/wefetepass_preview_deploy}"
APP_DIR="${APP_DIR:-/opt/wefetepass-preview/app}"
ENV_FILE="${ENV_FILE:-/etc/wefetepass/wefetepass.env}"
SUPABASE_ENV_FILE="${SUPABASE_ENV_FILE:-/opt/trinibuild/supabase/.env}"
CADDYFILE="${CADDYFILE:-/opt/trinibuild/caddy/Caddyfile}"
CONTAINER="${CONTAINER:-wefetepass-preview}"
IMAGE_PREFIX="${IMAGE_PREFIX:-wefetepass-preview}"
PREVIEW_SITE_URL="${PREVIEW_SITE_URL:-https://preview.wefetepass.com}"
DEFAULT_PUBLIC_SUPABASE_URL="${DEFAULT_PUBLIC_SUPABASE_URL:-https://api.nextbagchaser.com}"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue() { printf '\033[34m%s\033[0m\n' "$*"; }

if [[ "$EUID" -ne 0 ]]; then
  red "Run as root."
  exit 1
fi

for cmd in git docker python3; do
  command -v "$cmd" >/dev/null 2>&1 || { red "Missing required command: $cmd"; exit 1; }
done

if [[ "$REPO_URL" == https://github.com/* ]]; then
  REPO_URL="git@github.com:${REPO_URL#https://github.com/}"
fi

if [[ -f "$DEPLOY_KEY" ]]; then
  export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
else
  blue "Deploy key not found at $DEPLOY_KEY; using default SSH credentials."
  export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  red "Missing app env file: $ENV_FILE"
  exit 1
fi

if [[ ! -f "$SUPABASE_ENV_FILE" ]]; then
  red "Missing Supabase env file: $SUPABASE_ENV_FILE"
  exit 1
fi

get_env() {
  local file="$1"
  local key="$2"
  grep -m1 "^${key}=" "$file" | cut -d= -f2- || true
}

PUBLIC_SUPABASE_URL="$(get_env "$ENV_FILE" NEXT_PUBLIC_SUPABASE_URL)"
PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL:-$DEFAULT_PUBLIC_SUPABASE_URL}"
SUPABASE_ANON_KEY="$(get_env "$ENV_FILE" NEXT_PUBLIC_SUPABASE_ANON_KEY)"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$(get_env "$SUPABASE_ENV_FILE" ANON_KEY)}"
SUPABASE_SERVICE_ROLE_KEY="$(get_env "$ENV_FILE" SUPABASE_SERVICE_ROLE_KEY)"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(get_env "$SUPABASE_ENV_FILE" SERVICE_ROLE_KEY)}"
PASS_SIGNING_SECRET="$(get_env "$ENV_FILE" PASS_SIGNING_SECRET)"
PASS_SIGNING_SECRET="${PASS_SIGNING_SECRET:-$(get_env "$ENV_FILE" JWT_SECRET)}"
PASS_SIGNING_SECRET="${PASS_SIGNING_SECRET:-preview-pass-secret-change-me-$(date +%s)}"

if [[ -z "$SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  red "Supabase keys are missing. Need ANON_KEY/SERVICE_ROLE_KEY in $SUPABASE_ENV_FILE or app aliases in $ENV_FILE."
  exit 1
fi

mkdir -p "$(dirname "$APP_DIR")" /opt/wefetepass-preview/backups

if [[ -d "$APP_DIR/.git" ]]; then
  blue "Updating $APP_DIR from $BRANCH"
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  blue "Cloning $REPO_URL into $APP_DIR"
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
SHA="$(git rev-parse --short HEAD)"
IMAGE="$IMAGE_PREFIX:$SHA"

blue "Building $IMAGE"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_SITE_URL="$PREVIEW_SITE_URL" \
  -t "$IMAGE" .

blue "Starting $CONTAINER"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -e NEXT_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e SUPABASE_URL="$PUBLIC_SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e NEXT_PUBLIC_SITE_URL="$PREVIEW_SITE_URL" \
  -e PASS_SIGNING_SECRET="$PASS_SIGNING_SECRET" \
  -v /etc/wefetepass:/etc/wefetepass \
  --network caddy_default \
  "$IMAGE" >/dev/null

docker network connect ollama_default "$CONTAINER" >/dev/null 2>&1 || true
docker network connect supabase_default "$CONTAINER" >/dev/null 2>&1 || true

if [[ -f "$CADDYFILE" ]] && docker ps --format '{{.Names}}' | grep -q '^caddy$'; then
  blue "Installing preview Caddy route"
  cp "$CADDYFILE" "$CADDYFILE.bak.preview.$(date +%Y%m%d%H%M%S)"
  python3 - <<'PY'
from pathlib import Path
path = Path('/opt/trinibuild/caddy/Caddyfile')
text = path.read_text()
start = text.find('# === WeFetePass Claude preview website ===')
block = '''# === WeFetePass Claude preview website ===
preview.wefetepass.com {
    encode zstd gzip
    reverse_proxy wefetepass-preview:3000
}
'''
if start >= 0:
    next_marker = text.find('\n# === ', start + 5)
    text = text[:start] + block + (text[next_marker:] if next_marker >= 0 else '')
else:
    text = text.rstrip() + '\n\n' + block
path.write_text(text)
PY
  docker exec caddy caddy validate --config /etc/caddy/Caddyfile
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile
fi

sleep 5
blue "Container:"
docker ps --filter "name=$CONTAINER" --format '{{.Names}} {{.Image}} {{.Status}}'

blue "Internal smoke:"
docker run --rm --network caddy_default curlimages/curl:latest -fsS "http://$CONTAINER:3000/" >/dev/null
green "OK http://$CONTAINER:3000/"

if command -v curl >/dev/null 2>&1; then
  blue "Public smoke:"
  curl -k -sS -o /dev/null -w "HTTP %{http_code} $PREVIEW_SITE_URL\n" "$PREVIEW_SITE_URL/"
fi

docker images "$IMAGE_PREFIX" --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' | awk 'NR>3 {print $1}' | xargs -r docker rmi >/dev/null 2>&1 || true

green "Preview deployed: $PREVIEW_SITE_URL ($IMAGE)"
