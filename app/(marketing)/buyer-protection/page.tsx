import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  ArrowRight,
  RefreshCcw,
  Clock,
  BadgeCheck,
  CreditCard,
  QrCode,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustBadge } from "@/components/trust-badge";

export const metadata: Metadata = {
  title: "Buyer Protection — WeFetePass",
  description:
    "WeFetePass guarantees every ticket or your money back. Full refund if an event is cancelled, dispute resolution within 5 business days, and verified promoters only.",
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

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
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

export default function BuyerProtectionPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-[#e8dfd2]">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#d8ab5b]/15">
        {/* Background radials */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,171,91,0.18),transparent_44%),radial-gradient(circle_at_80%_60%,rgba(23,116,111,0.10),transparent_30%),linear-gradient(180deg,#050505,#030303)]"
        />

        <div className="container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full border border-[#d8ab5b]/40 bg-[#0d0b07] p-5 shadow-[0_0_32px_rgba(216,171,91,0.20)]">
              <ShieldCheck className="h-10 w-10 text-[#d8ab5b]" aria-hidden />
            </div>

            <h1 className="font-serif text-5xl leading-tight tracking-[-0.03em] text-[#f2d9ad] md:text-6xl lg:text-7xl">
              Your money is protected.
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-[#e8dfd2]/75">
              WeFetePass guarantees every ticket or your money back. We vet every promoter, monitor every event, and stand behind every purchase.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/discover"
                className="group inline-flex h-12 items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] px-6 text-[12px] font-semibold uppercase tracking-[0.3em] text-black shadow-[0_8px_24px_rgba(185,133,63,0.25)] transition-opacity hover:opacity-90"
              >
                Browse events
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/refunds/new"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#d8ab5b]/45 bg-black/30 px-6 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#d8ab5b] backdrop-blur-md transition-colors hover:bg-[#d8ab5b]/10"
              >
                File a dispute
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <SectionLabel>How it works</SectionLabel>
            <SectionHeading>Three steps. Total peace of mind.</SectionHeading>
          </div>

          <ol className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3" role="list">
            {[
              {
                step: "01",
                Icon: Ticket,
                title: "Buy your ticket",
                body: "Pay by bank transfer. Our AI verifies your receipt in seconds and confirms your order immediately.",
              },
              {
                step: "02",
                Icon: QrCode,
                title: "Instant QR pass",
                body: "Your unique QR code lands directly on WhatsApp. Screenshot it, share it — it is yours and only works once.",
              },
              {
                step: "03",
                Icon: BadgeCheck,
                title: "Verified entry",
                body: "Our trained scanner team scans your QR at the door. Real-time validation. No fakes get through.",
              },
            ].map(({ step, Icon, title, body }, i) => (
              <li key={step} className="relative">
                {i < 2 && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-6 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-[#d8ab5b]/30 to-transparent md:block"
                  />
                )}
                <div className="rounded-xl border border-[#d8ab5b]/20 bg-[#0d0b07] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-serif text-3xl text-[#d8ab5b]/40">{step}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-black/40">
                      <Icon className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-[#f2d9ad]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#e8dfd2]/65">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Our Promise ──────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <SectionLabel>Our promise</SectionLabel>
            <SectionHeading>What we guarantee.</SectionHeading>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                Icon: RefreshCcw,
                title: "100% money back if event is cancelled",
                body: "If an organizer cancels their event, every ticket holder receives a full refund — automatically, with no claim required.",
              },
              {
                Icon: Clock,
                title: "Dispute resolution within 5 business days",
                body: "Raise a dispute through your buyer portal. Our trust team responds within one business day and resolves within five.",
              },
              {
                Icon: BadgeCheck,
                title: "Verified promoters only",
                body: "Every promoter on WeFetePass undergoes identity and business verification before selling their first ticket.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-[#d8ab5b]/20 bg-[#0d0b07] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#d8ab5b]/30 bg-[#d8ab5b]/10">
                  <Icon className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
                </div>
                <h3 className="font-serif text-xl leading-snug text-[#f2d9ad]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#e8dfd2]/65">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Refund Policy ────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Refund policy</SectionLabel>
            <SectionHeading className="mb-8">The terms, plainly stated.</SectionHeading>

            <div className="space-y-4">
              {[
                {
                  Icon: RefreshCcw,
                  heading: "Cancellation or postponement by organizer",
                  body: "If the event is cancelled or postponed by the organizer, all ticket holders receive a full refund of the ticket price — including any service fees.",
                },
                {
                  Icon: Clock,
                  heading: "Buyer-initiated requests",
                  body: "Refund requests are accepted up to 48 hours before the event start time. Requests submitted after this window may be declined at the organizer's discretion.",
                },
                {
                  Icon: CreditCard,
                  heading: "Processing time",
                  body: "Once approved, refunds are processed within 3–5 business days to the original payment method (bank account).",
                },
                {
                  Icon: AlertTriangle,
                  heading: "Platform fee (7.5%)",
                  body: "The 7.5% platform fee is non-refundable for buyer-initiated cancellations. It is fully refunded only when the event is cancelled by the organizer.",
                },
              ].map(({ Icon, heading, body }) => (
                <div
                  key={heading}
                  className="flex gap-4 rounded-xl border border-neutral-800 bg-[#0a0906] p-5"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
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

      {/* ── Not covered ──────────────────────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>What is not covered</SectionLabel>
            <SectionHeading className="mb-8">Exclusions to know.</SectionHeading>

            <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-6 md:p-8">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-amber-400/80">
                The following are not eligible for refunds:
              </p>
              <ul className="space-y-3 text-sm leading-relaxed text-[#e8dfd2]/70">
                {[
                  "Last-minute personal change of plans or inability to attend.",
                  "Weather conditions, unless the organizer officially cancels the event.",
                  "Tickets purchased through third-party resellers — WeFetePass only covers purchases made directly on the platform.",
                  "Events that proceed as described, regardless of personal experience.",
                  "Lost or stolen QR codes that have already been scanned.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Verified promoters context ───────────────────────────────────── */}
      <section className="border-b border-[#d8ab5b]/10 py-20">
        <div className="container">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="shrink-0">
              <TrustBadge verified size="lg" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#f2d9ad] md:text-3xl">
                All promoters on WeFetePass go through identity verification.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#e8dfd2]/65">
                Before any promoter can sell a single ticket, they submit government-issued ID, business registration documents, and social proof. Our trust team reviews every application. You will always know who you are buying from.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact / Dispute CTA ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#d8ab5b]/25 bg-[#0d0b07] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5)] md:p-12">
            <GoldDivider />
            <SectionLabel>Need help?</SectionLabel>
            <h2 className="font-serif text-3xl text-[#f2d9ad] md:text-4xl">
              Something went wrong with your ticket?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#e8dfd2]/65">
              File a dispute and our trust team will review it within one business day. We are on your side.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/refunds/new"
                className="group inline-flex h-12 items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] px-6 text-[12px] font-semibold uppercase tracking-[0.3em] text-black shadow-[0_8px_24px_rgba(185,133,63,0.25)] transition-opacity hover:opacity-90"
              >
                File a dispute
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/support"
                className="inline-flex h-12 items-center rounded-lg border border-[#d8ab5b]/35 bg-transparent px-6 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#d8ab5b] transition-colors hover:bg-[#d8ab5b]/10"
              >
                Contact support
              </Link>
            </div>
            <GoldDivider />
          </div>
        </div>
      </section>
    </main>
  );
}
