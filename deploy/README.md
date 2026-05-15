# WeFetePass — Self-Host Deployment Kit

Three things to set up: the app, nginx in front, TLS. Pick **Docker** or **systemd**.

## Required env vars

Put these in `.env.production` (compose) or `/opt/wefetepass/.env.production` (systemd):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PASS_SIGNING_SECRET=
# Optional:
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
APPLE_WALLET_CERT=
GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY=
```

> Supabase is **not** bundled — point at your own Supabase project (cloud or self-hosted).

---

## Path A — Docker (recommended)

```bash
git clone <repo> /opt/wefetepass && cd /opt/wefetepass
cp .env.example .env.production   # then edit
docker compose up -d --build
docker compose logs -f web
```

The healthcheck hits `/` (no `/api/health` route exists yet — change `docker-compose.yml` if you add one). App listens on `127.0.0.1:3000` after publishing the port; nginx handles TLS.

## Path B — systemd (no Docker)

```bash
# As root on Ubuntu/Debian:
adduser --system --group --home /opt/wefetepass deploy
git clone <repo> /opt/wefetepass
chown -R deploy:deploy /opt/wefetepass
cd /opt/wefetepass
sudo -u deploy npm ci --legacy-peer-deps
sudo -u deploy npm run build
# Drop env file:
sudo -u deploy vi .env.production
# Install unit:
sudo cp deploy/wefetepass.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now wefetepass
sudo journalctl -u wefetepass -f
```

Node 20+ required (`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs`).

## Nginx reverse proxy (both paths)

```bash
sudo apt install -y nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/wefetepass
# Edit the file — replace wefetepass.example.com with your domain (3 places).
sudo ln -s /etc/nginx/sites-available/wefetepass /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## TLS with certbot (4 lines)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wefetepass.example.com
sudo systemctl enable --now certbot.timer
sudo nginx -t && sudo systemctl reload nginx
```

## Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Updates

```bash
# systemd host:
bash deploy/deploy.sh
# Docker host:
bash deploy/deploy.sh --docker
```

Override defaults via env: `APP_DIR=/srv/wfp GIT_BRANCH=release bash deploy/deploy.sh`.

## Troubleshooting

- **Build OOM** — Next builds need ~2 GB. Add swap or build elsewhere and rsync `.next/`.
- **Peer dep errors** — Always use `--legacy-peer-deps`; the deploy script already does.
- **502 from nginx** — App not listening yet. Check `docker compose logs web` or `journalctl -u wefetepass`.
- **Door scanner disconnects** — confirm the `/door/` location block from `nginx.conf` is present (SSE buffering off).
