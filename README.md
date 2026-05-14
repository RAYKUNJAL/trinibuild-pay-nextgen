# CashConnect Caribbean — SaaS Platform

Multi-tenant SaaS for bank-verified cash-to-digital payments across emerging
markets. This repository implements the **Phase 1 (Months 1–6)** scaffolding
described in the master strategy: a multi-tenant database, the **API Licensing
tier** REST endpoints, a marketing site (landing, pricing, docs), and a
customer dashboard for managing API keys and usage.

> The full 5-year roadmap targets 300+ customers / USD $40M ARR / USD $1–3B
> valuation by Year 5. See `Strategy → Code` mapping below.

---

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push        # creates SQLite dev.db
npm run db:seed        # seeds a demo tenant + prints an API key
npm run dev
```

Open <http://localhost:3000>.

### Try the API

```bash
curl -X POST http://localhost:3000/api/v1/verifications \
  -H "Authorization: Bearer cc_test_<key from seed>" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "ORDER-1042",
    "bank_code": "RBL",
    "account_number": "1234567890",
    "amount_minor": 12500,
    "currency": "TTD",
    "payer_name": "Aaliyah Mohammed"
  }'
```

---

## Architecture

| Layer            | Tech                                                           |
| ---------------- | -------------------------------------------------------------- |
| Web              | Next.js 15 App Router + React 19 + Tailwind                    |
| API              | Next.js Route Handlers under `/api/v1/*`                       |
| Auth (dashboard) | HttpOnly JWT cookie (`jose`) + bcrypt password hashing         |
| Auth (API)       | Bearer API keys, bcrypt-hashed at rest, prefix-indexed lookup  |
| Data             | Prisma + SQLite for dev; swap `DATABASE_URL` for Postgres/MySQL |
| Validation       | Zod schemas at every API boundary                              |

### Multi-tenancy

Every domain row carries a `tenantId`. All queries are scoped to the
authenticated tenant (via API key or session cookie) — there is no
cross-tenant query path in this codebase. Indices on `(tenantId, …)` keep
lookups fast as the platform grows from 21 → 300+ customers.

### Tier model

```
TenantTier := API_LICENSING | WHITE_LABEL | ENTERPRISE
```

The same multi-tenant codebase serves all three tiers; tier only changes
billing, branding capabilities, and SLA — not the data model.

---

## API surface (v1)

| Method | Path                              | Auth         | Purpose                          |
| ------ | --------------------------------- | ------------ | -------------------------------- |
| GET    | `/api/v1/health`                  | none         | Liveness probe                   |
| POST   | `/api/v1/verifications`           | API key      | Create a bank-deposit verification |
| GET    | `/api/v1/verifications`           | API key      | List your tenant's verifications |
| GET    | `/api/v1/verifications/:id`       | API key      | Retrieve a single verification   |
| POST   | `/api/auth/signup`                | none         | Create a workspace               |
| POST   | `/api/auth/login`                 | none         | Issue session cookie             |
| POST   | `/api/auth/logout`                | session      | Clear session cookie             |
| GET    | `/api/dashboard/keys`             | session      | List API keys                    |
| POST   | `/api/dashboard/keys`             | session      | Mint a new API key (raw shown once) |
| DELETE | `/api/dashboard/keys/:id`         | session      | Revoke a key                     |
| GET    | `/api/dashboard/usage`            | session      | Month-to-date counters + recent  |

See `/docs` once the dev server is running for the customer-facing API
reference.

---

## Pages

| Path             | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `/`              | Marketing landing — value prop + three-tier preview       |
| `/pricing`       | Full pricing breakdown, sourced from `src/lib/pricing.ts` |
| `/docs`          | Developer-facing API reference (v1)                       |
| `/signup`        | Create workspace                                          |
| `/login`         | Sign in                                                   |
| `/dashboard`     | Overview: MTD verifications, success rate, recent activity |
| `/dashboard/keys`| Mint, list, revoke API keys                               |

---

## Strategy → code mapping

The master spec drives these decisions. Concrete links:

- **Three revenue tiers** → `src/lib/pricing.ts` and `/pricing` page
  reflect the exact TTD pricing from the strategy (TTD $1k/mo + $15/verification,
  TTD $15k/mo + revenue share, custom enterprise).
- **API Licensing tier launch (Months 1–6)** → `/api/v1/verifications`
  POST/GET + API-key auth + sandbox/live modes.
- **Multi-tenant SaaS architecture** → `prisma/schema.prisma` enforces
  `tenantId` on every row; auth modules in `src/lib/auth.ts` and
  `src/lib/api-keys.ts` scope everything to a tenant.
- **Dual-agent fraud validation** → `src/lib/verification.ts` exposes the
  deterministic stub. In production this calls bank rails + an ML fraud agent
  and only settles when both agree.
- **Dashboard for customer success** → `/dashboard` and `/dashboard/keys`
  give every API customer a self-serve console — required for the
  21 → 69 → 133 → 200 → 300 customer growth curve.
- **Global expansion** → Currency is per-tenant (default TTD, configurable
  to NGN/KES/INR/BRL/etc.). Country code and currency live on `Tenant`.

---

## Next milestones (from the master plan)

- **Months 4–6** — Sign 5 API tier customers. Publish OpenAPI spec, ship
  TypeScript/Python/Go SDKs, build 2–3 case studies.
- **Months 7–9** — Add white-label tier: per-tenant branding (`brandColor`,
  `brandLogoUrl` already in schema), merchant sub-accounts, branded consumer
  app shell.
- **Months 10–12** — Enterprise tier: dedicated SLA, custom rate limits,
  on-prem deploy mode, BYOK secrets.

---

## Roadmap (from master spec, abbreviated)

| Year | Customers | ARR (USD) | Milestone                                  |
| ---- | --------- | --------- | ------------------------------------------ |
| 1    | 21        | 0.43M     | Caribbean proof of concept                 |
| 2    | 69        | 1.85M     | Africa expansion, Series A                 |
| 3    | 133       | 5.5M      | South Asia entry, Series B                 |
| 4    | 265       | 15.6M     | Latin America, Series C                    |
| 5    | 300+      | 40M       | IPO or strategic acquisition (USD $1–3B)   |

---

## Development scripts

```
npm run dev          # next dev
npm run build        # prisma generate && next build
npm run typecheck    # tsc --noEmit
npm run db:push      # apply schema to dev SQLite
npm run db:seed      # idempotent seed
```

## License

Proprietary — © Ray Kunjal / CashConnect Caribbean.
