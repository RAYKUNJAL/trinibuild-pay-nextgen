# WeFetePass Stress Tests

k6 load-testing harness for the four production hotspots: discover reads, gate scans, fete-drop checkouts, and WhatsApp broadcasts.

## 1. Install k6

**macOS**

```bash
brew install k6
```

**Ubuntu / Debian** (via Grafana's apt repo)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

Verify with `k6 --version`.

## 2. Run a single test

```bash
# Discover (read flood) — no extra env needed
BASE_URL=https://staging.wefetepass.com k6 run stress/k6-discover.js

# Checkout (drop flood) — needs real event + tier seeded with high quantity
BASE_URL=https://staging.wefetepass.com \
EVENT_ID=evt_brainwash_staging \
TIER_ID=tier_ga_staging \
EVENT_SLUG=soca-brainwash-staging \
  k6 run stress/k6-checkout.js

# Scan (gate flood) — seed test passes in staging first
BASE_URL=https://staging.wefetepass.com \
PASS_CODES=ABC123,DEF456,GHI789,JKL012,MNO345 \
PASS_IDS=pass_001,pass_002,pass_003,pass_004,pass_005 \
  k6 run stress/k6-scan.js

# WhatsApp broadcast — needs an auth token + a seeded broadcast
BASE_URL=https://staging.wefetepass.com \
BROADCAST_ID=bcast_test_5000 \
AUTH_TOKEN=eyJhbGc... \
  k6 run stress/k6-whatsapp-broadcast.js
```

## 3. Run all sequentially

```bash
BASE_URL=https://staging.wefetepass.com bash stress/run-all.sh
```

Order: discover -> scan -> checkout -> broadcast. The script exits non-zero on the first failure. Summaries land in `stress/results/*.json`.

## 4. What each test simulates

- **discover** — Promoter shares an Instagram story; ten thousand visitors slam `/discover?island=tt&page=1` in five minutes. Probes the **CDN / Next.js cache** and any DB queries that leak past it. If p95 spikes here, your cache layer is broken or you're rendering uncached server components per request.

- **scan** — Carnival Friday gate opens; six scanners fire `POST /api/passes/[id]/verify` 5x concurrent each. Probes **scan endpoint latency, DB write contention on pass-redemption rows, and idempotency** (re-scanning a used pass must not 500). p95 over 500ms means doormen will see lag and start waving people in.

- **checkout** — Soca Brainwash tickets drop; three thousand buyers fire `POST /api/checkout` in sixty seconds. Probes the **oversell-protection path** — concurrency control around tier inventory. The correct response under flood is a mix of 200 (winners) and 409 (sold out). A 200 returned after inventory hit zero is an **oversell bug** and the test will flag it.

- **broadcast** — A single triggered job blasts WhatsApp to five thousand past attendees. Probes the **background worker queue and rate-limit handling** with Meta's API. Must complete inside five minutes with zero 5xx during polling.

## 5. Interpreting results

After each run, k6 prints thresholds (red = failed). Read in this order:

1. **`oversell_events` count (checkout)** — must be **zero**. If non-zero, you sold tickets you didn't have. Stop and fix concurrency before anything else.
2. **`http_req_failed` rate** — excluding expected statuses (409 sold out, 304 cache hit). Should be under 1% for checkout/discover, under 0.5% for scan.
3. **p95 latency** — checkout < 2000ms, scan < 500ms, discover < 800ms. p99 should be within 2x of p95 — a wide spread means you have a slow-path that fires under contention (lock waits, cold cache, N+1 query).
4. **5xx rate** — any sustained 5xx means the server is melting. Check `get_logs` in Supabase, look for connection-pool exhaustion or function timeouts.
5. **Cache hit rate (discover)** — should trend toward 100% within the first 30s as the CDN warms. If misses stay high, your `Cache-Control` headers or ISR config is wrong.
6. **Scanner idempotency** — `idempotency_failures` must be zero. A second verify on a used pass should always return the same outcome class (200 same-result, 409, or 410).

## 6. WARNING — do not run against production

- **NEVER** point checkout flood at a real promoter's drop. You will create thousands of pending orders, trigger real Stripe holds, and almost certainly oversell their fete.
- Always use a **staging environment** seeded with:
  - A test event with a tier set to a high quantity (e.g. 100,000) so the test exercises the path without sold-out-storming immediately, OR a low quantity (e.g. 50) if you specifically want to validate oversell protection.
  - Disposable buyer accounts (`loadtest+*@wefetepass.test`).
  - A dummy WhatsApp broadcast targeting a test phone number list, never real attendees.
- The scan test will mark passes used. Seed disposable passes — do not run against real attendee data.
- The broadcast test sends real WhatsApp messages if pointed at production credentials. Use Meta's sandbox / a test app.
