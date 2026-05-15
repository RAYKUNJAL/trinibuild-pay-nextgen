#!/usr/bin/env bash
# WeFetePass deploy script.
#   Usage:
#     bash deploy/deploy.sh            # systemd path (pull, build, restart)
#     bash deploy/deploy.sh --docker   # docker compose path (pull, up -d --build)
#
# Env overrides:
#   APP_DIR        (default: /opt/wefetepass)
#   GIT_REMOTE     (default: origin)
#   GIT_BRANCH     (default: main)
#   SERVICE_NAME   (default: wefetepass)

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/wefetepass}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-wefetepass}"

MODE="systemd"
if [[ "${1:-}" == "--docker" ]]; then
    MODE="docker"
fi

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m!! %s\033[0m\n' "$*" >&2; exit 1; }

[[ -d "$APP_DIR" ]] || fail "APP_DIR '$APP_DIR' does not exist."
cd "$APP_DIR"

log "Pulling latest from ${GIT_REMOTE}/${GIT_BRANCH} in $APP_DIR"
git fetch "$GIT_REMOTE" "$GIT_BRANCH"
git checkout "$GIT_BRANCH"
git pull --ff-only "$GIT_REMOTE" "$GIT_BRANCH"

if [[ "$MODE" == "docker" ]]; then
    log "Docker mode: rebuilding and restarting compose stack"
    docker compose pull || true
    docker compose up -d --build
    log "Docker stack is up. Recent status:"
    docker compose ps
else
    log "systemd mode: installing deps"
    npm ci --legacy-peer-deps

    log "Building production bundle"
    npm run build

    log "Restarting systemd service: $SERVICE_NAME"
    sudo systemctl restart "$SERVICE_NAME"

    log "Service status:"
    sudo systemctl --no-pager --full status "$SERVICE_NAME" | head -n 15 || true
fi

log "Deploy complete."
