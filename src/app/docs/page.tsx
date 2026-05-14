import { SiteFooter, SiteNav } from "@/components/site-nav";

export const metadata = { title: "API Docs — CashConnect" };

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-ink-900 text-ink-50 text-sm font-mono p-4 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <header>
          <p className="text-xs uppercase tracking-wide text-brand-700 font-semibold">
            API Reference · v1
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink-900">
            CashConnect REST API
          </h1>
          <p className="mt-3 text-ink-500">
            All requests use HTTPS and Bearer authentication with an API key issued from
            your dashboard. Test keys are prefixed <code>cc_test_</code> and live keys
            <code> cc_live_</code>.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Authentication</h2>
          <p className="mt-2 text-ink-500">
            Pass your API key in the <code>Authorization</code> header:
          </p>
          <Code>{`Authorization: Bearer cc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Create a verification</h2>
          <p className="mt-2 text-ink-500">
            Submit a deposit to verify it against the bank ledger.
          </p>
          <Code>{`POST /api/v1/verifications
Content-Type: application/json
Authorization: Bearer cc_live_...

{
  "reference":       "ORDER-1042",
  "bank_code":       "RBL",
  "account_number":  "1234567890",
  "amount_minor":    12500,
  "currency":        "TTD",
  "payer_name":      "Aaliyah Mohammed"
}`}</Code>
          <h3 className="mt-6 font-semibold text-ink-900">Response 201</h3>
          <Code>{`{
  "id": "ckxv...",
  "reference": "ORDER-1042",
  "status": "verified",
  "amount_minor": 12500,
  "currency": "TTD",
  "bank_code": "RBL",
  "account_last4": "7890",
  "failure_reason": null,
  "verified_at": "2026-05-14T10:32:08.214Z",
  "created_at":  "2026-05-14T10:32:08.214Z"
}`}</Code>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Retrieve a verification</h2>
          <Code>{`GET /api/v1/verifications/{id}
Authorization: Bearer cc_live_...`}</Code>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">List verifications</h2>
          <Code>{`GET /api/v1/verifications?status=verified&limit=25
Authorization: Bearer cc_live_...`}</Code>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Errors</h2>
          <p className="mt-2 text-ink-500">All errors return a stable shape:</p>
          <Code>{`{
  "error": {
    "code":    "invalid_request",
    "message": "Validation failed",
    "details": { ... }
  }
}`}</Code>
          <ul className="mt-4 text-sm text-ink-500 list-disc pl-5 space-y-1">
            <li><code>unauthorized</code> — 401, missing API key</li>
            <li><code>invalid_api_key</code> — 401, revoked or unknown key</li>
            <li><code>invalid_request</code> — 422, body validation failed</li>
            <li><code>duplicate_reference</code> — 409, reference already used</li>
            <li><code>not_found</code> — 404</li>
            <li><code>internal_error</code> — 500</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900">SDKs</h2>
          <p className="mt-2 text-ink-500">
            Official SDKs for TypeScript, Python, and Go ship from the dashboard once
            you create your first API key.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
