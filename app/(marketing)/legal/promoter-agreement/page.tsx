import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  BadgeCheck,
  CalendarClock,
  Banknote,
  ShieldX,
  TriangleAlert,
  Award,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Promoter Platform Agreement — WeFetePass",
  description:
    "WeFetePass Promoter Platform Agreement: eligibility, event standards, payout terms, prohibited conduct, and penalty structure for T&T event promoters.",
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-4 py-2" aria-hidden>
      <span className="h-px flex-1 bg-[#d8ab5b]/20" />
      <span className="h-1.5 w-1.5 rotate-45 border border-[#d8ab5b]/50" />
      <span className="h-px flex-1 bg-[#d8ab5b]/20" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#d8ab5b]">
      {children}
    </p>
  );
}

function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-serif text-2xl tracking-tight text-[#f2d9ad] md:text-3xl"
    >
      {children}
    </h2>
  );
}

function ProseBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#e8dfd2]/70">
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-[#e8dfd2]/70">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8ab5b]/50"
            aria-hidden
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromoterAgreementPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-[#e8dfd2]">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#d8ab5b]/15">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,171,91,0.12),transparent_45%),linear-gradient(180deg,#050505,#030303)]"
        />
        <div className="container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full border border-[#d8ab5b]/40 bg-[#0d0b07] p-5 shadow-[0_0_32px_rgba(216,171,91,0.15)]">
              <Briefcase className="h-10 w-10 text-[#d8ab5b]" aria-hidden />
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-[#f2d9ad] md:text-5xl lg:text-6xl">
              Promoter Platform Agreement
            </h1>
            <p className="mt-4 text-sm text-[#e8dfd2]/50">Last updated: May 2026</p>
            <p className="mt-4 text-base leading-relaxed text-[#e8dfd2]/70">
              By listing an event on WeFetePass, you agree to the following terms. This agreement
              governs your use of the platform, your obligations to ticket buyers, and WeFetePass&apos;s
              rights and responsibilities.
            </p>
          </div>
        </div>
      </section>

      {/* ── Table of contents ─────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-10">
        <div className="container">
          <nav className="mx-auto max-w-3xl" aria-label="Page sections">
            <SectionLabel>Contents</SectionLabel>
            <ol className="grid gap-2 sm:grid-cols-2 text-sm text-[#d8ab5b]/80">
              {[
                ["#eligibility", "Eligibility"],
                ["#event-standards", "Event Standards"],
                ["#payout", "Payout Terms"],
                ["#prohibited", "Prohibited Conduct"],
                ["#penalties", "Penalties"],
                ["#verification", "Verification"],
                ["#contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-1.5 hover:text-[#f2d9ad] transition-colors"
                  >
                    <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      <div className="container py-16">
        <div className="mx-auto max-w-3xl space-y-16">

          {/* 1. Eligibility */}
          <section id="eligibility" aria-labelledby="eligibility-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <BadgeCheck className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 1</SectionLabel>
                <SectionHeading id="eligibility-heading">Eligibility</SectionHeading>
                <ProseBody>
                  <p>
                    To list events and sell tickets on WeFetePass, you must meet all of the following
                    criteria at the time of application and on an ongoing basis:
                  </p>
                </ProseBody>
                <BulletList
                  items={[
                    "Be at least 18 years of age.",
                    "Be a resident of Trinidad and Tobago or a business registered in Trinidad and Tobago.",
                    "Pass WeFetePass identity verification before your first event goes live.",
                    "Have no prior history of fraud, ticket scams, or chargebacks on this or any other ticketing platform.",
                    "Agree to these terms in full — partial acceptance is not permitted.",
                  ]}
                />
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 2. Event Standards */}
          <section id="event-standards" aria-labelledby="event-standards-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <CalendarClock className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 2</SectionLabel>
                <SectionHeading id="event-standards-heading">Event Standards</SectionHeading>
                <ProseBody>
                  <p>
                    You are responsible for the accuracy and quality of every event you list.
                    All events must meet the following standards:
                  </p>
                </ProseBody>
                <BulletList
                  items={[
                    "The event must be a real, scheduled gathering at the stated venue and time.",
                    "Event descriptions, lineups, and ticket tiers must be accurate at the time of publishing.",
                    "If event details change (venue, date, lineup), you must notify all ticket holders within 24 hours of the change.",
                    "Events cannot be cancelled within 72 hours of the start time without incurring a 15% cancellation fee on total ticket revenue collected.",
                    "Organizers must honour their own advertised refund policies in addition to WeFetePass minimum standards.",
                    "Ticket capacity must match actual venue capacity. Overselling beyond venue limits is prohibited.",
                  ]}
                />
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 3. Payout Terms */}
          <section id="payout" aria-labelledby="payout-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <Banknote className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 3</SectionLabel>
                <SectionHeading id="payout-heading">Payout Terms</SectionHeading>
                <ProseBody>
                  <p>
                    WeFetePass holds all ticket revenue in escrow until the event has concluded:
                  </p>
                </ProseBody>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      heading: "Payout timing",
                      body: "Funds are released to your registered bank account 48 hours after the event end time, once no active disputes remain.",
                    },
                    {
                      heading: "Chargeback reserve",
                      body: "A 5% chargeback reserve is held for 14 days post-event. This reserve covers any buyer disputes raised in the post-event window. Unused reserve funds are released on day 15.",
                    },
                    {
                      heading: "Platform fee — standard",
                      body: "7.5% of gross ticket revenue (inclusive of buyer-facing service fees). This is deducted before payout.",
                    },
                    {
                      heading: "Platform fee — verified promoters",
                      body: "6.5% of gross ticket revenue. Reduced fee unlocked after completing full identity and business verification.",
                    },
                    {
                      heading: "Payout method",
                      body: "Bank transfer to T&T bank accounts only (Republic Bank, First Citizens, Scotiabank TT, RBC Royal Bank TT). International transfers are not supported in this initial phase.",
                    },
                  ].map(({ heading, body }) => (
                    <div
                      key={heading}
                      className="rounded-lg border border-[#d8ab5b]/12 bg-[#0a0906] px-4 py-3"
                    >
                      <p className="font-semibold text-[#f2d9ad]">{heading}</p>
                      <p className="mt-1 text-sm text-[#e8dfd2]/65">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 4. Prohibited */}
          <section id="prohibited" aria-labelledby="prohibited-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-800/30 bg-red-950/20">
                <ShieldX className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 4</SectionLabel>
                <SectionHeading id="prohibited-heading">Prohibited Conduct</SectionHeading>
                <ProseBody>
                  <p>
                    The following actions are strictly prohibited and will result in immediate
                    account suspension pending investigation:
                  </p>
                </ProseBody>

                <div className="mt-5 rounded-xl border border-red-800/25 bg-red-950/10 px-5 py-4">
                  <ul className="space-y-2.5">
                    {[
                      "Creating or listing fake or fictitious events.",
                      "Using misleading event descriptions, fabricated lineups, or false venue claims.",
                      "Manipulating ticket prices after purchases have been made.",
                      "Transferring buyer personal data (names, phones, emails) off the WeFetePass platform.",
                      "Failing to honour approved refunds within the agreed timeline.",
                      "Issuing tickets beyond approved venue capacity.",
                      "Creating multiple accounts to circumvent bans or fee structures.",
                      "Selling tickets outside of WeFetePass for the same event while using the platform.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[#e8dfd2]/70">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/50"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 5. Penalties */}
          <section id="penalties" aria-labelledby="penalties-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <TriangleAlert className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 5</SectionLabel>
                <SectionHeading id="penalties-heading">Penalties</SectionHeading>
                <ProseBody>
                  <p>
                    WeFetePass operates a three-strike enforcement system for policy violations:
                  </p>
                </ProseBody>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      strike: "Strike 1",
                      label: "Written Warning",
                      color: "amber",
                      body: "A formal written warning is issued detailing the violation. The account remains active. A repeat offence within 12 months moves to Strike 2.",
                    },
                    {
                      strike: "Strike 2",
                      label: "30-Day Suspension",
                      color: "orange",
                      body: "The promoter account is suspended for 30 days. Upcoming events may be cancelled with buyer refunds processed. All funds in escrow are held pending review.",
                    },
                    {
                      strike: "Strike 3",
                      label: "Permanent Ban",
                      color: "red",
                      body: "Permanent ban from the platform. All funds are withheld until outstanding chargebacks and disputes are resolved. The matter may be referred to relevant T&T authorities.",
                    },
                  ].map(({ strike, label, color, body }) => (
                    <div
                      key={strike}
                      className={`flex gap-4 rounded-lg border px-4 py-3 ${
                        color === "amber"
                          ? "border-amber-800/30 bg-amber-950/10"
                          : color === "orange"
                            ? "border-orange-800/30 bg-orange-950/10"
                            : "border-red-800/30 bg-red-950/10"
                      }`}
                    >
                      <div className="shrink-0 text-center">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            color === "amber"
                              ? "text-amber-400"
                              : color === "orange"
                                ? "text-orange-400"
                                : "text-red-400"
                          }`}
                        >
                          {strike}
                        </span>
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            color === "amber"
                              ? "text-amber-300"
                              : color === "orange"
                                ? "text-orange-300"
                                : "text-red-300"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="mt-1 text-sm text-[#e8dfd2]/65">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-[#e8dfd2]/45">
                  Severe violations (fraud, fake events, data misuse) may result in immediate
                  permanent ban without the three-strike progression.
                </p>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 6. Verification */}
          <section id="verification" aria-labelledby="verification-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <Award className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 6</SectionLabel>
                <SectionHeading id="verification-heading">Verification</SectionHeading>
                <ProseBody>
                  <p>
                    Promoter verification is optional but strongly recommended. Verified promoters
                    receive a{" "}
                    <strong className="text-[#f2d9ad]">verified badge</strong> on their profile
                    and all event pages, and qualify for the reduced 6.5% platform fee.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">Verification requirements:</strong>
                  </p>
                </ProseBody>
                <BulletList
                  items={[
                    "Valid government-issued photo ID (national ID, passport, or driver's permit).",
                    "Business registration certificate (for corporate promoters) or sole-trader declaration.",
                    "Proof of a T&T bank account in the promoter's or business's name.",
                    "One past event reference (a link, flyer, or press coverage of a previous event you organised).",
                  ]}
                />
                <p className="mt-4 text-sm text-[#e8dfd2]/60">
                  Verification is reviewed by the WeFetePass Trust team within 3 business days.
                  You can sell tickets as an unverified promoter in the interim, subject to a
                  higher payout fee and extended hold period.
                </p>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 7. Contact */}
          <section id="contact" aria-labelledby="promoter-contact-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <Briefcase className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 7</SectionLabel>
                <SectionHeading id="promoter-contact-heading">
                  Contact &amp; Promoter Support
                </SectionHeading>
                <ProseBody>
                  <p>
                    For onboarding, verification, payout queries, or policy questions, contact the
                    WeFetePass promoter team:
                  </p>
                </ProseBody>

                <div className="mt-5 space-y-3">
                  <a
                    href="mailto:promoters@wefetepass.com"
                    className="flex items-center gap-3 rounded-lg border border-[#d8ab5b]/20 bg-[#0d0b07] px-4 py-3 text-sm text-[#d8ab5b] transition-colors hover:border-[#d8ab5b]/40 hover:bg-[#d8ab5b]/5"
                  >
                    <span className="font-mono">promoters@wefetepass.com</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                  <Link
                    href="/promoters"
                    className="flex items-center gap-3 rounded-lg border border-[#d8ab5b]/20 bg-[#0d0b07] px-4 py-3 text-sm text-[#d8ab5b] transition-colors hover:border-[#d8ab5b]/40 hover:bg-[#d8ab5b]/5"
                  >
                    <span>Promoter portal &amp; onboarding</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden />
                  </Link>
                </div>

                <p className="mt-4 text-xs text-[#e8dfd2]/40">
                  Promoter support hours: Monday–Friday, 9 AM–6 PM AST. Urgent payout or event
                  issues handled within 4 hours during business hours.
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-[#d8ab5b]/15" />

          {/* Footer */}
          <p className="text-center text-xs text-[#e8dfd2]/35">
            This agreement is governed by the laws of the Republic of Trinidad and Tobago.
            Any disputes arising from this agreement will be resolved in the courts of
            Trinidad and Tobago. WeFetePass reserves the right to amend these terms with
            14 days&apos; written notice to active promoters.
          </p>
        </div>
      </div>
    </main>
  );
}
