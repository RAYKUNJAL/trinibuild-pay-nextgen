# WeFetePass platform-ops agents

The admin dashboard at `/admin` is the human UI for platform operators.
Every action there is also exposed as a JSON API at `/api/admin/*`, so an
AI agent (Block's Goose, Claude Agent SDK, n8n, a cron-driven script…) can
triage queues automatically and only hand off to a human when confidence
is low.

## What's here

Each recipe is a single markdown file with YAML frontmatter (`description`,
`schedule`) followed by a task description. Goose interprets the file with
`goose run agents/<recipe>.md`; the Claude Agent SDK reads the same file
as a system prompt.

- `verification-triage.md` — hourly promoter verification triage
- (add more: `receipt-triage.md`, `refund-triage.md`, `daily-digest.md`)

## Available admin endpoints

All endpoints require the caller's session cookie to belong to a profile
with `role === 'admin'`. They return JSON when the request's
`Content-Type: application/json`; otherwise they 303-redirect (form mode).

| Verb | Path                                            | Purpose                              |
|------|-------------------------------------------------|--------------------------------------|
| POST | `/api/admin/verifications/:id/decision`         | `{ decision: "approve"\|"deny", notes? }` |
| POST | `/api/admin/receipts/:id/decision`              | `{ decision: "approve"\|"reject", notes? }` |
| POST | `/api/admin/announce`                           | `{ title, body, target, channel }`   |

There is no list endpoint yet — agents should query Supabase directly
with the service role key for read access. The Supabase project URL +
service role key are in `.env.local` (see `lib/env.ts`).

## Authenticating an agent

1. Create a dedicated service-account user in Supabase Auth (e.g.
   `ops-agent@wefetepass.internal`).
2. In the `profiles` row for that user, set `role = 'admin'`.
3. Save the session cookie / refresh token in the agent's runtime
   (Goose: `~/.config/goose/secrets.yaml`; Claude SDK: env var).
4. Required env vars for the agent host:
   - `WEFETEPASS_ADMIN_COOKIE` — `sb-<project>-auth-token` cookie value
   - `WEFETEPASS_BASE_URL` — e.g. `https://wefetepass.com`
   - `ANTHROPIC_API_KEY` — for any Claude calls inside the recipe
   - `SUPABASE_SERVICE_ROLE_KEY` — read-only queue inspection
   - `SLACK_WEBHOOK_URL` — fallback when confidence is low

## Running locally

```bash
# Goose
goose run agents/verification-triage.md

# Claude Agent SDK (Node)
npx @anthropic-ai/claude-code run --system-prompt agents/verification-triage.md
```

## Safety rails

- Recipes should **never auto-approve** without a confidence threshold
  (≥0.85 recommended) AND a sanity check (no prior denials, no flagged
  prior orders).
- All API calls write `reviewed_by = <agent profile id>` so a human can
  audit decisions in `/admin/users/<agent-id>`.
- Set `schedule:` in frontmatter conservatively. Hourly is fine for
  triage queues; daily for digests; never sub-minute.
