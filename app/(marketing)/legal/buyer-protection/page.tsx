import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  RefreshCcw,
  Clock,
  Scale,
  QrCode,
  ArrowRight,
  ArrowUpRight,
  TicketCheck,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Buyer Protection Policy — WeFetePass",
  description:
    "WeFetePass Buyer Protection Policy: refund eligibility, dispute process, ticket authenticity, and transfer rules for T&T carnival ticket buyers.",
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

// ─── Refund table rows ────────────────────────────────────────────────────────

const refundRows: {
  situation: string;
  outcome: string;
  automatic: boolean;
}[] = [
  {
    situation: "Event cancelled by organizer",
    outcome: "Full refund — ticket price + all fees",
    automatic: true,
  },
  {
    situation: "Event postponed by organizer",
    outcome: "Option to accept new date OR request full refund",
    automatic: false,
  },
  {
    situation: "Buyer unable to attend (request ≥ 48 h before event)",
    outcome: "Partial refund — minus 7.5% platform fee",
    automatic: false,
  },
  {
    situation: "Technical error by WeFetePass platform",
    outcome: "Full refund — ticket price + all fees",
    automatic: true,
  },
  {
    situation: "Buyer change of mind (< 48 h before event)",
    outcome: "No refund — at organizer's discretion only",
    automatic: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerProtectionPolicyPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-[#e8dfd2]">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#d8ab5b]/15">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,171,91,0.15),transparent_45%),linear-gradient(180deg,#050505,#030303)]"
        />
        <div className="container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full border border-[#d8ab5b]/40 bg-[#0d0b07] p-5 shadow-[0_0_32px_rgba(216,171,91,0.18)]">
              <ShieldCheck className="h-10 w-10 text-[#d8ab5b]" aria-hidden />
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-[#f2d9ad] md:text-5xl lg:text-6xl">
              Buyer Protection Policy
            </h1>
            <p className="mt-4 text-sm text-[#e8dfd2]/50">
              Last updated: May 2026
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#e8dfd2]/70">
              Every ticket purchased on WeFetePass is backed by our guarantee. Read on to understand
              exactly what you&apos;re covered for and how to get help if something goes wrong.
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
                ["#guarantee", "Our Guarantee"],
                ["#refunds", "Refund Eligibility"],
                ["#how-to-refund", "How to Request a Refund"],
                ["#dispute", "Dispute Process"],
                ["#authenticity", "Ticket Authenticity"],
                ["#transfers", "Transfer Policy"],
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

          {/* 1. Guarantee */}
          <section id="guarantee" aria-labelledby="guarantee-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <ShieldCheck className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 1</SectionLabel>
                <SectionHeading id="guarantee-heading">Our Guarantee</SectionHeading>
                <ProseBody>
                  <p>
                    Every ticket purchased on WeFetePass is guaranteed authentic. Our QR passes are
                    cryptographically signed — they cannot be faked, duplicated, or tampered with.
                  </p>
                  <p>
                    If an event is cancelled by the organizer, you will receive a{" "}
                    <strong className="text-[#f2d9ad]">full refund automatically</strong> — no claim
                    required, no hoops to jump through. The refund is initiated within 24 hours of
                    the cancellation notice.
                  </p>
                  <p>
                    WeFetePass acts as the escrow between you and the promoter. Funds are only
                    released to the promoter 48 hours after a successful event — giving us time to
                    catch any disputes.
                  </p>
                </ProseBody>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 2. Refund Eligibility */}
          <section id="refunds" aria-labelledby="refunds-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <RefreshCcw className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div className="flex-1">
                <SectionLabel>Section 2</SectionLabel>
                <SectionHeading id="refunds-heading">Refund Eligibility</SectionHeading>
                <ProseBody>
                  <p>The following table outlines what you are entitled to in each scenario:</p>
                </ProseBody>

                <div className="mt-6 overflow-x-auto rounded-xl border border-[#d8ab5b]/15">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#d8ab5b]/15 bg-[#0d0b07]">
                        <th className="px-4 py-3 text-left font-semibold text-[#d8ab5b]">
                          Situation
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-[#d8ab5b]">
                          Outcome
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-[#d8ab5b]">
                          Automatic
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundRows.map((row, i) => (
                        <tr
                          key={row.situation}
                          className={`border-b border-[#d8ab5b]/8 ${
                            i % 2 === 0 ? "bg-black/20" : "bg-[#0a0906]"
                          }`}
                        >
                          <td className="px-4 py-3 text-[#e8dfd2]/80">{row.situation}</td>
                          <td className="px-4 py-3 text-[#e8dfd2]/70">{row.outcome}</td>
                          <td className="px-4 py-3 text-center">
                            {row.automatic ? (
                              <span className="inline-block rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-400">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-neutral-900/60 px-2 py-0.5 text-xs text-neutral-500">
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 3. How to Request a Refund */}
          <section id="how-to-refund" aria-labelledby="how-to-refund-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <Clock className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 3</SectionLabel>
                <SectionHeading id="how-to-refund-heading">
                  How to Request a Refund
                </SectionHeading>
                <ProseBody>
                  <p>Follow these steps to submit a refund request:</p>
                </ProseBody>

                <ol className="mt-5 space-y-3">
                  {[
                    ["Go to My Orders", "Log in and open the Orders section in your buyer dashboard."],
                    ["Select the Order", "Find the event order and click it to open the detail view."],
                    ["Request Refund", "Click the 'Request Refund' button on the order page."],
                    ["Choose a Reason", "Select the reason for your request from the dropdown list."],
                    ["Submit", "Review your request and submit. You will receive a confirmation by email."],
                  ].map(([step, detail], i) => (
                    <li
                      key={step}
                      className="flex gap-4 rounded-lg border border-[#d8ab5b]/12 bg-[#0a0906] px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d8ab5b]/30 bg-[#d8ab5b]/10 text-xs font-bold text-[#d8ab5b]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[#f2d9ad]">{step}</p>
                        <p className="mt-0.5 text-sm text-[#e8dfd2]/65">{detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 rounded-lg border border-[#d8ab5b]/15 bg-[#0d0b07] px-4 py-3">
                  <p className="text-sm font-semibold text-[#d8ab5b]">Timeline</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#e8dfd2]/70">
                    <li>Organizer responds within 48 hours of submission.</li>
                    <li>If escalated, WeFetePass reviews within 5 business days.</li>
                    <li>Approved refunds are processed to your original bank account within 3–5 business days.</li>
                  </ul>
                </div>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 4. Dispute Process */}
          <section id="dispute" aria-labelledby="dispute-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <Scale className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 4</SectionLabel>
                <SectionHeading id="dispute-heading">Dispute Process</SectionHeading>
                <ProseBody>
                  <p>
                    A dispute is triggered when you and an organizer cannot agree on a refund
                    outcome, or when you believe an event did not match its advertised description.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">WeFetePass as mediator:</strong> Our Trust
                    team will review evidence from both parties and issue a binding decision.
                    We are impartial — we apply the same standard to every dispute regardless of
                    the promoter&apos;s size or history.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">Evidence to provide:</strong> Order
                    confirmation, screenshots of event page at time of purchase, any communication
                    with the organizer, and a clear description of what was misrepresented.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">Resolution timeline:</strong> All disputes
                    are resolved within 5 business days. You will receive written notification of
                    the outcome via email.
                  </p>
                </ProseBody>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 5. Ticket Authenticity */}
          <section id="authenticity" aria-labelledby="authenticity-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <QrCode className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 5</SectionLabel>
                <SectionHeading id="authenticity-heading">Ticket Authenticity</SectionHeading>
                <ProseBody>
                  <p>
                    All QR passes issued by WeFetePass are{" "}
                    <strong className="text-[#f2d9ad]">cryptographically signed</strong> using
                    HMAC-SHA256 JWTs. Each QR code encodes your pass ID, event ID, and a unique
                    secret code — these cannot be forged without our private key.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">Duplicate QR codes are rejected at
                    the door.</strong> Our scanner system marks each pass as used on first scan.
                    Any attempt to re-scan the same code will fail instantly, regardless of how
                    many screenshots exist.
                  </p>
                  <p>
                    <strong className="text-[#f2d9ad]">Third-party resales are not covered.</strong>{" "}
                    Tickets purchased from third-party resellers (social media, WhatsApp groups,
                    etc.) carry no buyer protection from WeFetePass. We strongly advise purchasing
                    only through wefetepass.com.
                  </p>
                </ProseBody>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 6. Transfer Policy */}
          <section id="transfers" aria-labelledby="transfers-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <TicketCheck className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 6</SectionLabel>
                <SectionHeading id="transfers-heading">Transfer Policy</SectionHeading>
                <ProseBody>
                  <p>
                    WeFetePass allows ticket transfers between buyers to accommodate group plans.
                    Transfers are subject to the following rules:
                  </p>

                  <ul className="mt-4 space-y-2">
                    {[
                      "Transfers must be initiated at least 2 hours before gates open (or as specified by the event organizer).",
                      "Each ticket can be transferred a maximum of 2 times (organizers may set a lower limit).",
                      "The original buyer is responsible if a ticket is transferred to the wrong person.",
                      "Transferred tickets carry the same authenticity guarantee — the QR code is re-signed on acceptance.",
                      "Transfer links expire after 48 hours or at gates-close, whichever is sooner.",
                      "Some events may restrict transfers or require organizer approval. Check the event page for specific rules.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8ab5b]/50"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </ProseBody>
              </div>
            </div>
            <GoldDivider />
          </section>

          {/* 7. Contact */}
          <section id="contact" aria-labelledby="contact-heading">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8ab5b]/25 bg-[#d8ab5b]/8">
                <AlertTriangle className="h-5 w-5 text-[#d8ab5b]" aria-hidden />
              </div>
              <div>
                <SectionLabel>Section 7</SectionLabel>
                <SectionHeading id="contact-heading">Contact &amp; Support</SectionHeading>
                <ProseBody>
                  <p>
                    For disputes, refund questions, or buyer protection enquiries, reach out to
                    our Trust team:
                  </p>
                </ProseBody>

                <div className="mt-5 space-y-3">
                  <a
                    href="mailto:disputes@wefetepass.com"
                    className="flex items-center gap-3 rounded-lg border border-[#d8ab5b]/20 bg-[#0d0b07] px-4 py-3 text-sm text-[#d8ab5b] transition-colors hover:border-[#d8ab5b]/40 hover:bg-[#d8ab5b]/5"
                  >
                    <span className="font-mono">disputes@wefetepass.com</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                  <a
                    href="https://wa.me/18687654321?text=WeFetePass+Buyer+Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[#d8ab5b]/20 bg-[#0d0b07] px-4 py-3 text-sm text-[#d8ab5b] transition-colors hover:border-[#d8ab5b]/40 hover:bg-[#d8ab5b]/5"
                  >
                    <span>WhatsApp Business</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                </div>

                <p className="mt-4 text-xs text-[#e8dfd2]/40">
                  Response times: Monday–Friday, 8 AM–8 PM AST. Critical events (day-of) are
                  monitored around the clock.
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-[#d8ab5b]/15" />

          {/* Footer note */}
          <p className="text-xs text-[#e8dfd2]/35 text-center">
            This policy is a platform-level commitment. Event-specific terms set by individual
            organizers may add restrictions. Always review the event page before purchase.
            WeFetePass reserves the right to update this policy with 14 days&apos; notice.
          </p>
        </div>
      </div>
    </main>
  );
}
