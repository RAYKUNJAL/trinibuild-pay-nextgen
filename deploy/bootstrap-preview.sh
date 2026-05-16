#!/usr/bin/env bash
# bootstrap-preview.sh — deploy WeFetePass preview alongside the existing live site
# Run as root on your server. Idempotent: re-running rebuilds + restarts cleanly.
#
#   curl -fsSL https://raw.githubusercontent.com/RAYKUNJAL/trinibuild-pay-nextgen/claude/setup-wefetepass-platform-m59Ht/deploy/bootstrap-preview.sh | bash
#
# After this completes, add the Caddy snippet from deploy/Caddyfile.preview-snippet
# to /etc/caddy/Caddyfile and run: caddy reload --config /etc/caddy/Caddyfile

set -euo pipefail

REPO_URL="https://github.com/RAYKUNJAL/trinibuild-pay-nextgen.git"
BRANCH="claude/setup-wefetepass-platform-m59Ht"
APP_DIR="/opt/wefetepass-preview/app"
CONTAINER_NAME="wefetepass-preview"
HOST_PORT="${HOST_PORT:-3001}"
ENV_FILE="${ENV_FILE:-/etc/wefetepass/wefetepass.env}"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

if [[ "$EUID" -ne 0 ]]; then
  red "Run as root."
  exit 1
fi

for cmd in git docker; do
  command -v "$cmd" >/dev/null 2>&1 || { red "Missing required command: $cmd"; exit 1; }
done

if [[ ! -f "$ENV_FILE" ]]; then
  red "Env file not found at $ENV_FILE."
  red "Either create it or pass ENV_FILE=/path/to/file when invoking."
  exit 1
fi

# 1. Clone or update
if [[ -d "$APP_DIR/.git" ]]; then
  blue "→ Updating existing checkout at $APP_DIR"
  git -C "$APP_DIR" fetch origin "$BRANCH" --depth=1
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  blue "→ Cloning $REPO_URL into $APP_DIR (branch: $BRANCH)"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" --depth=1 "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
GIT_SHA="$(git rev-parse --short HEAD)"
IMAGE_TAG="wefetepass-preview:${GIT_SHA}"

# 2. Build
blue "→ Building image $IMAGE_TAG"
docker build -t "$IMAGE_TAG" -t wefetepass-preview:latest .

# 3. Replace running container if present
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  blue "→ Stopping previous $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" >/dev/null || true
  docker rm "$CONTAINER_NAME" >/dev/null || true
fi

# 4. Run on 127.0.0.1 only — Caddy fronts it
blue "→ Starting $CONTAINER_NAME on host port ${HOST_PORT} (loopback only)"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p "127.0.0.1:${HOST_PORT}:3000" \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  "$IMAGE_TAG" >/dev/null

# 5. Health check
sleep 3
if curl -fsS "http://127.0.0.1:${HOST_PORT}/" >/dev/null 2>&1; then
  green "✓ Preview is up at http://127.0.0.1:${HOST_PORT}"
else
  red "Container started but HTTP check failed. Inspect logs:"
  echo "  docker logs --tail 80 ${CONTAINER_NAME}"
  exit 1
fi

# 6. Prune old preview images (keep last 3)
docker images wefetepass-preview --format '{{.ID}} {{.CreatedAt}}' \
  | sort -k2 -r | awk 'NR>3 {print $1}' \
  | xargs -r docker rmi -f >/dev/null 2>&1 || true

cat <<EOF

─────────────────────────────────────────────────────────────
$(green "PREVIEW DEPLOYED")  ($IMAGE_TAG)
─────────────────────────────────────────────────────────────

  Container:  ${CONTAINER_NAME}
  Listening:  127.0.0.1:${HOST_PORT}
  Logs:       docker logs -f ${CONTAINER_NAME}
  Stop:       docker stop ${CONTAINER_NAME}

NEXT — add this to /etc/caddy/Caddyfile (replace 'preview' with whatever
subdomain you want):

preview.wefetepass.com {
    reverse_proxy 127.0.0.1:${HOST_PORT}
    encode zstd gzip
    log {
        output file /var/log/caddy/preview.wefetepass.com.log
        format console
    }
}

Then: caddy reload --config /etc/caddy/Caddyfile

To redeploy after my repo updates:
  bash $APP_DIR/deploy/bootstrap-preview.sh

EOF
