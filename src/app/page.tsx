import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site-nav";

const STATS = [
  { label: "Underbanked served", value: "3B+" },
  { label: "Countries targeted", value: "50+" },
  { label: "Settlement window", value: "≤15 min" },
  { label: "Fraud-detection accuracy", value: "99.5%" },
];

const TIER_PREVIEW = [
  {
    name: "API Licensing",
    blurb: "REST API + SDKs. 30 minutes to integrate.",
    price: "From TTD $1,000/mo + TTD $15/verification",
  },
  {
    name: "White-Label Platform",
    blurb: "Branded merchant dashboard + customer app.",
    price: "From TTD $15,000/mo + revenue share",
  },
  {
    name: "Enterprise",
    blurb: "Custom deploy, 99.99% SLA, on-prem option.",
    price: "Quoted per deal",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              SaaS infrastructure for emerging-market payments
            </span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-ink-900">
              The payment rails for the <span className="text-brand-600">3 billion</span> people banks ignore.
            </h1>
            <p className="mt-5 text-lg text-ink-500">
              CashConnect verifies cash deposits against bank ledgers in under 15 minutes,
              then settles to merchants. License our API, white-label the platform, or
              deploy on-prem.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Start free trial
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center rounded-md border border-ink-100 px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-ink-50"
              >
                Read the API docs →
              </Link>
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-ink-100 p-5">
                <dt className="text-xs uppercase tracking-wide text-ink-500">{s.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-ink-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-ink-50 border-y border-ink-100">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold text-ink-900">Three ways to license</h2>
            <p className="mt-2 text-ink-500 max-w-2xl">
              Start with the API tier and graduate to white-label or enterprise as you grow.
              Same platform, same SLAs, same fraud engine — different depth of integration.
            </p>
            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {TIER_PREVIEW.map((t) => (
                <div key={t.name} className="rounded-xl bg-white border border-ink-100 p-6">
                  <h3 className="font-semibold text-ink-900">{t.name}</h3>
                  <p className="mt-2 text-sm text-ink-500">{t.blurb}</p>
                  <p className="mt-6 text-sm font-medium text-brand-700">{t.price}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/pricing"
                className="text-sm font-semibold text-brand-700 hover:text-brand-900"
              >
                Compare all tiers →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold text-ink-900">Why bank verification, not card rails?</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
            <div className="rounded-xl border border-ink-100 p-6">
              <h3 className="font-semibold text-ink-900">Works without credit cards</h3>
              <p className="mt-2 text-ink-500">
                Most of the Global South pays in cash. We verify bank deposits, not card
                authorizations — so coverage extends to the unbanked customer too.
              </p>
            </div>
            <div className="rounded-xl border border-ink-100 p-6">
              <h3 className="font-semibold text-ink-900">10× cheaper than card rails</h3>
              <p className="mt-2 text-ink-500">
                0.25% effective fee vs 2.9% + fixed. Card networks can&apos;t price-compete in
                markets they don&apos;t serve well.
              </p>
            </div>
            <div className="rounded-xl border border-ink-100 p-6">
              <h3 className="font-semibold text-ink-900">Dual-agent fraud engine</h3>
              <p className="mt-2 text-ink-500">
                Every verification is checked against the bank ledger and a behavioral
                fraud agent. Settlement only fires on both signals agreeing.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
