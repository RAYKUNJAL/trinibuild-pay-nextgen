import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { TIERS, formatTTD } from "@/lib/pricing";

export const metadata = { title: "Pricing — CashConnect" };

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-ink-900">
            Pricing built for emerging-market scale
          </h1>
          <p className="mt-3 text-ink-500">
            Pay a monthly platform fee + a per-verification fee. Enterprise customers can
            negotiate revenue share, custom SLA, and on-prem deployments.
          </p>
        </header>

        <div className="mt-14 grid lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              className="rounded-2xl border border-ink-100 p-7 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-ink-900">{tier.name}</h2>
              <p className="mt-1 text-sm text-ink-500">{tier.tagline}</p>

              <div className="mt-6 space-y-1 text-sm">
                {tier.monthlyFeeTTD > 0 ? (
                  <p>
                    <span className="text-2xl font-semibold text-ink-900">
                      {formatTTD(tier.monthlyFeeTTD)}
                    </span>
                    <span className="text-ink-500"> / month</span>
                  </p>
                ) : (
                  <p className="text-2xl font-semibold text-ink-900">Custom</p>
                )}
                {tier.setupFeeTTD > 0 && (
                  <p className="text-ink-500">
                    + {formatTTD(tier.setupFeeTTD)} one-time setup
                  </p>
                )}
                {tier.perVerificationTTD > 0 && (
                  <p className="text-ink-500">
                    + {formatTTD(tier.perVerificationTTD)} per successful verification
                  </p>
                )}
                {tier.revenueSharePercent && (
                  <p className="text-ink-500">
                    + {(tier.revenueSharePercent * 100).toFixed(0)}% revenue share
                  </p>
                )}
              </div>

              <ul className="mt-6 space-y-2 text-sm text-ink-900">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-600">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs uppercase tracking-wide text-ink-500">Best for</p>
              <p className="mt-1 text-sm text-ink-900">{tier.bestFor}</p>

              <Link
                href={tier.id === "ENTERPRISE" ? "/contact" : "/signup"}
                className="mt-auto pt-6 text-center inline-flex justify-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                {tier.ctaLabel}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-ink-900">FAQs</h2>
          <dl className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="font-semibold text-ink-900">Is there a free trial?</dt>
              <dd className="mt-1 text-ink-500">
                Yes — every new tenant starts in TRIAL status with sandbox keys and up to
                1,000 free test verifications.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-900">Which currencies are supported?</dt>
              <dd className="mt-1 text-ink-500">
                TTD, JMD, BBD, NGN, KES, GHS, INR, BRL, MXN — and any ISO-4217 currency you
                configure at the tenant level.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-900">Can we migrate from Stripe / PayPal?</dt>
              <dd className="mt-1 text-ink-500">
                Yes. Our API mirrors common payment-intent semantics. Most teams complete
                migration in a sprint.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-900">Where is data stored?</dt>
              <dd className="mt-1 text-ink-500">
                Each tenant chooses a deployment region. Enterprise customers can deploy
                on-prem inside their own VPC.
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
