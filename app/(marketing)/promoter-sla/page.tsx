import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  Ban,
  BadgeCheck,
  AlertTriangle,
  Banknote,
  Bell,
  CalendarX,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Promoter Standards — WeFetePass",
  description:
    "What we expect from every promoter on WeFetePass — commitments, consequences, payout policy, and how verification unlocks lower fees.",
};

// ─── Layout helpers ──────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-4 py-2" aria-hidden>
      <span className="h-px flex-1 bg-[#d8ab5b]/25" />
      <span className="h-1.5 w-1.5 rotate-45 border border-[#d8ab5b]/60" />
      <span className="h-px flex-1 bg-[#d8ab5b]/25" />
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

function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-serif text-3xl tracking-tight text-[#f2d9ad] md:text-4xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PromoterSlaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-[#e8dfd2]">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#d8ab5b]/15">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,171,91,0.15),transparent_44%),radial-gradient(circle_at_20%_80%,rgba(88,42,103,0.12),transparent_30%),linear-gradient(180deg,#050505,#030303)]"
        />

        <div className="container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full border border-[#d8ab5b]/40 bg-[#0d0b07] p-5 shadow-[0_0_32px_rgba(216,171,91,0.18)]">
              <Award className="h-10 w-10 text-[#d8ab5b]" aria-hidden />
            </div>

            <h1 className="font-serif text-5xl leading-tight tracking-[-0.03em] text-[#f2d9ad] md:text-6xl lg:text-7xl">
              The WeFetePass Standard.
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-[#e8dfd2]/75">
              Every promoter who sells on WeFetePass agrees to these standards. We hold every organiser to the same bar — because your reputation is our platform's reputation.
            </p>

            <div className="mt-8">
              <Link
                href="/dashboard/verification"
                className="group inline-flex h-12 items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] px-6 text-[12px] font-semibold uppercase tracking-[0.3em] text-black shadow-[0_8px_24px_rgba(185,133,63,0.25)] transition-opacity hover:opacity-90"
              >
                Apply to get verified
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Commitments ──────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <SectionLabel>Your commitments</SectionLabel>
            <SectionHeading>What every promoter agrees to.</SectionHeading>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              {
                Icon: CheckCircle2,
                title: "Honour all tickets",
                body: "Every valid QR code sold on WeFetePass must be honoured at the door. No exceptions.",
              },
              {
                Icon: Banknote,
                title: "Process approved refunds within 5 days",
                body: "Once a refund is approved by our trust team, you must complete the payment within five business days.",
              },
              {
                Icon: BadgeCheck,
                title: "Provide accurate event details",
                body: "Venue, time, performer lineup, and ticket inclusions must be truthful and kept up to date.",
              },
              {
                Icon: Bell,
                title: "Notify buyers of changes",
                body: "Any change to venue, start time, or major lineup must be communicated to all ticket holders within 24 hours of the decision.",
              },
              {
                Icon: CalendarX,
                title: "No last-minute cancellations",
                body: "Cancelling within 72 hours of the event triggers automatic buyer refunds and a trust-score penalty.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border border-[#d8ab5b]/15 bg-[#0d0b07] p-5"
              >
                <div className="mt-0.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                    <Icon className="h-4 w-4 text-[#d8ab5b]" aria-hidden />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[#f2d9ad]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#e8dfd2]/65">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Consequences ─────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <SectionLabel>Consequences</SectionLabel>
            <SectionHeading>What happens if you don&apos;t.</SectionHeading>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {/* Strike system */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0906]">
              <div className="border-b border-neutral-800 px-6 py-4">
                <h3 className="font-serif text-xl text-[#f2d9ad]">Violation strike system</h3>
                <p className="mt-1 text-sm text-[#e8dfd2]/60">
                  Each confirmed breach of the WeFetePass Standard counts as a strike.
                </p>
              </div>

              <ol className="divide-y divide-neutral-800" role="list">
                {[
                  {
                    strike: "Strike 1",
                    Icon: AlertTriangle,
                    color: "text-amber-400",
                    borderColor: "border-amber-700/40",
                    bg: "bg-amber-950/20",
                    label: "Formal warning",
                    detail:
                      "A written warning is issued and logged on your account. Trust score is reduced.",
                  },
                  {
                    strike: "Strike 2",
                    Icon: ShieldAlert,
                    color: "text-orange-400",
                    borderColor: "border-orange-700/40",
                    bg: "bg-orange-950/20",
                    label: "30-day suspension",
                    detail:
                      "Your account is suspended for 30 days. Existing events continue, but no new events can be created or published.",
                  },
                  {
                    strike: "Strike 3",
                    Icon: Ban,
                    color: "text-red-400",
                    borderColor: "border-red-800/40",
                    bg: "bg-red-950/20",
                    label: "Permanent ban",
                    detail:
                      "Your promoter account is permanently closed. Any pending payouts are held pending dispute resolution.",
                  },
                ].map(({ strike, Icon, color, borderColor, bg, label, detail }) => (
                  <li
                    key={strike}
                    className={cn("flex items-start gap-4 px-6 py-5", bg, "border-l-2", borderColor)}
                  >
                    <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", color)} aria-hidden />
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", color)}>
                        {strike}
                      </p>
                      <p className="font-semibold text-[#f2d9ad]">{label}</p>
                      <p className="mt-1 text-sm text-[#e8dfd2]/65">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Automatic actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-[#0a0906] p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-red-700/30 bg-red-950/20">
                  <RefreshCcwIcon className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="font-semibold text-[#f2d9ad]">Automatic buyer refunds</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#e8dfd2]/65">
                  If a violation results in buyers not receiving what they paid for, refunds are triggered automatically from your payout balance — no manual approval required.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-[#0a0906] p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-amber-700/30 bg-amber-950/20">
                  <TrendingDown className="h-4 w-4 text-amber-400" aria-hidden />
                </div>
                <h3 className="font-semibold text-[#f2d9ad]">Trust score impact</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#e8dfd2]/65">
                  Every verified complaint and breach reduces your public trust score. A lower score affects your visibility in search and can trigger buyer warnings on your event pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout Policy ────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Payout policy</SectionLabel>
            <SectionHeading className="mb-8">When and how you get paid.</SectionHeading>

            <div className="space-y-4">
              {[
                {
                  Icon: Banknote,
                  heading: "48-hour post-event release",
                  body: "Funds are held until 48 hours after the event date to allow time for any disputes or scanning discrepancies to be resolved before payout.",
                },
                {
                  Icon: AlertTriangle,
                  heading: "Chargeback reserve (14 days)",
                  body: "A portion of your payout may be held in reserve for up to 14 days after the event to cover any chargeback or dispute costs. The reserve is released in full if no claims are made.",
                },
                {
                  Icon: CheckCircle2,
                  heading: "Direct to your T&T bank",
                  body: "Approved payouts go straight to your registered T&T bank account. No third-party wallets, no conversion fees.",
                },
              ].map(({ Icon, heading, body }) => (
                <div
                  key={heading}
                  className="flex gap-4 rounded-xl border border-neutral-800 bg-[#0a0906] p-5"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d8ab5b]/20 bg-[#d8ab5b]/8">
                      <Icon className="h-4 w-4 text-[#d8ab5b]" aria-hidden />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#f2d9ad]">{heading}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#e8dfd2]/65">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Verification Unlock ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#d8ab5b]/30 bg-[#0d0b07] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(216,171,91,0.08)] md:p-12">
            <GoldDivider />
            <SectionLabel>Verification requirement</SectionLabel>

            <h2 className="font-serif text-3xl text-[#f2d9ad] md:text-4xl">
              Verified promoters unlock lower fees.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#e8dfd2]/65">
              Complete identity and business verification to earn the Verified badge and have your platform fee reduced from 7.5% to 6.5% — permanently.
            </p>

            <div className="mx-auto mt-8 grid max-w-xs grid-cols-2 divide-x divide-[#d8ab5b]/20 rounded-xl border border-[#d8ab5b]/20 bg-black/30 text-center">
              <div className="px-6 py-5">
                <p className="text-2xl font-bold text-neutral-500 line-through">7.5%</p>
                <p className="mt-1 text-xs text-neutral-500">Standard</p>
              </div>
              <div className="px-6 py-5">
                <p className="text-2xl font-bold text-[#d8ab5b]">6.5%</p>
                <p className="mt-1 text-xs text-[#d8ab5b]/75">Verified</p>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-[#e8dfd2]/70">
              {[
                "Verified badge on all your event pages",
                "Priority placement in search results",
                "Higher buyer confidence and conversion",
                "6.5% platform fee — 1% less on every ticket",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-left">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8ab5b]" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/dashboard/verification"
                className="group inline-flex h-12 items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] px-8 text-[12px] font-semibold uppercase tracking-[0.3em] text-black shadow-[0_8px_24px_rgba(185,133,63,0.25)] transition-opacity hover:opacity-90"
              >
                Apply to get verified
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <GoldDivider />
          </div>
        </div>
      </section>
    </main>
  );
}

// Inline icon alias to avoid duplicate import conflicts
function RefreshCcwIcon({ className }: { className?: string }) {
  return <Banknote className={cn("rotate-90", className)} aria-hidden />;
}
