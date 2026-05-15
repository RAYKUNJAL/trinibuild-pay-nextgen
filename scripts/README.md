# Seed script

Populates the WeFetePass database with realistic Caribbean fete events spread
across multiple islands so the `/discover` page is not empty during local /
preview testing.

## Install

`tsx` is the only thing you may need to add:

```bash
npm i -D tsx
```

## Required environment variables

The script reads these from `process.env`:

| Var                          | Source                                         |
| ---------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`   | Supabase project URL                           |
| `SUPABASE_SERVICE_ROLE_KEY`  | Service role key (bypasses RLS — keep secret!) |

Both should already be in your `.env.local`. Because this is a standalone
Node script (not Next.js), load them via Node's `--env-file` flag:

```bash
node --env-file=.env.local node_modules/.bin/tsx scripts/seed.ts
```

Or simply:

```bash
npm run seed     # but you must export the vars yourself, e.g. set -a; . .env.local; set +a
```

## What it creates

- One demo organizer profile: `seed-organizer@wefetepass.dev` (role `organizer`)
- 8 published events across 7 islands (TT, JM, BB, GD, AG, VC, GY)
- 3 ticket tiers per event: General, VIP, All-Inclusive Premium

## Idempotency

Each event uses a deterministic slug (`<title-slug>-<island-code>`). Re-running
the script will skip events that already exist and only insert what's missing.
Console output marks each row as `create` or `skip`.

## How to wipe seed data

There is no automated wipe. In the Supabase SQL editor:

```sql
-- WARNING: destroys ALL events, tiers, orders, passes, etc.
truncate table events cascade;

-- Optional: remove the seed organizer (auth + profile cascade)
delete from auth.users where email = 'seed-organizer@wefetepass.dev';
```

Do not run this against a production database.
