import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Banknote,
  QrCode,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Users,
  Ticket,
  Brain,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MidnightMasHero from "@/components/midnight-mas-hero";
import { FeaturedEventsStrip } from "@/components/featured-events-strip";
import { StickyMobileCTA } from "@/components/sticky-mobile-cta";
import { ISLANDS } from "@/lib/islands";

export const metadata: Metadata = {
  title: "WeFetePass — Caribbean fete tickets and promoter tools",
  description:
    "Find fetes across the Caribbean, pay by bank transfer, get a QR ticket on WhatsApp. Or sell tickets with the platform built for island promoters.",
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}

function HeroSplit() {
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div className="container grid gap-6 py-16 md:grid-cols-2 md:py-24">
        <Card className="relative overflow-hidden border-brand-red/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-red" aria-hidden />
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">Party goers</Badge>
            <CardTitle className="font-display text-3xl md:text-4xl">
              Find your next fete.
            </CardTitle>
            <CardDescription className="text-base">
              Browse events across the Caribbean, pay by bank transfer, get your QR ticket. No stress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/discover">
                Explore events <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-foreground" aria-hidden />
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">Promoters</Badge>
            <CardTitle className="font-display text-3xl md:text-4xl">
              Your next event, fully loaded.
            </CardTitle>
            <CardDescription className="text-base">
              Tickets, flyers, VIP, door ops, and AI tools — all from one platform built for T&T.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-up?role=promoter">
                Start selling <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const trustSignals = [
  {
    Icon: Banknote,
    title: "Pay by bank receipt",
    body: "Republic, Scotia, FCB transfers verified in seconds — no card needed.",
  },
  {
    Icon: QrCode,
    title: "QR at the door",
    body: "One scan in, one beep, you in. No printed tickets, no chaos.",
  },
  {
    Icon: MessageCircle,
    title: "WhatsApp delivery",
    body: "Your ticket lands straight in your chats — share it with the crew.",
  },
];

const buyerSteps = [
  { n: 1, title: "Find a fete", body: "Browse upcoming events and pick your vibe." },
  { n: 2, title: "Pay by bank transfer", body: "Upload your receipt — we verify it in seconds." },
  { n: 3, title: "QR on WhatsApp", body: "Show it at the gate. Done." },
];

const promoterSteps = [
  { n: 1, title: "Apply to sell tickets", body: "Quick onboarding, we set up your hosted page." },
  { n: 2, title: "Launch & promote", body: "AI flyers, VIP codes, and a scanner team — ready to go." },
  { n: 3, title: "Run the door, get paid", body: "Scan in seconds, payouts to your T&T bank weekly." },
];

const features = [
  {
    Icon: Ticket,
    title: "Bank-receipt ticketing",
    body: "Buyers pay by transfer. Promoters get receipts verified automatically. Fakes flagged in seconds.",
  },
  {
    Icon: MessageCircle,
    title: "WhatsApp-first delivery",
    body: "Tickets ship to WhatsApp for buyers. Promoters reach past attendees in one tap.",
  },
  {
    Icon: QrCode,
    title: "Gate that works",
    body: "Buyers scan once and walk in. Promoters get a trained scanner team that moves the line.",
  },
  {
    Icon: Sparkles,
    title: "AI built in",
    body: "Promoters get readiness scores and AI flyers. Buyers get smart recommendations for their fete season.",
  },
  {
    Icon: ShieldCheck,
    title: "Trust both sides",
    body: "Verified buyer reputation gets you fast-tracked. Verified promoters get more bookings.",
  },
  {
    Icon: Users,
    title: "Group ready",
    body: "Buyers split with the crew. Promoters sell tables and VIP sections without spreadsheets.",
  },
];

const faqs = [
  {
    q: "Is paying by bank transfer actually safe?",
    a: "Yes. Every receipt is checked by our AI fraud detection in seconds. If anything looks off, it gets flagged before your order is confirmed. Your ticket only releases once payment is verified.",
  },
  {
    q: "What happens if the event gets cancelled?",
    a: "100% refund to the bank account you paid from, processed within 5 business days. Buyer protection is automatic — you don't need to fight for it.",
  },
  {
    q: "How do I get my ticket?",
    a: "A WhatsApp message with your QR code within 60 seconds of payment verification. You can also add it to Apple Wallet or Google Wallet. No printing, no email lost in spam.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Just your name, phone, and bank receipt. You can create an account later if you want to track tickets across multiple fetes.",
  },
  {
    q: "What if my friends and I want to go together?",
    a: "Use group ticketing at checkout. One person pays, the others get their own QR codes on WhatsApp. No one chasing anyone for cash.",
  },
  {
    q: "Which islands are live?",
    a: "Trinidad & Tobago, Jamaica, Barbados, Grenada, St. Lucia, Antigua, St. Vincent, Dominica, Bahamas, Guyana, St. Kitts, and the USVI. More fetes drop every week.",
  },
];

const buyerQuotes = [
  {
    name: "Anika",
    role: "fete-goer",
    quote:
      "The QR landed on my WhatsApp before I left the ATM. Walked in like I owned the place.",
  },
  {
    name: "Daren",
    role: "Carnival regular",
    quote:
      "I split four tickets with the crew. Everyone got their own QR. No one chasing me for cash.",
  },
];

const aiCapabilities = [
  {
    Icon: ShieldCheck,
    title: "AI fraud detection",
    body: "Bank receipts scanned in seconds. Fakes flagged before they reach your inbox.",
  },
  {
    Icon: Gauge,
    title: "AI readiness coach",
    body: "Score every event before it goes live. Know exactly what's missing.",
  },
  {
    Icon: TrendingUp,
    title: "AI demand forecast",
    body: "Price smarter. Pace alerts when sales fall behind your last fete.",
  },
  {
    Icon: AlertTriangle,
    title: "AI post-event debrief",
    body: "What worked, what flopped, and what to do different next time.",
  },
];

type Cell = { kind: "check" } | { kind: "x" } | { kind: "partial"; label?: string } | { kind: "text"; label: string };

type ComparisonRow = {
  label: string;
  we: Cell;
  taack: Cell;
  island: Cell;
  eventbrite: Cell;
  diy: Cell;
};

const comparisonRows: ComparisonRow[] = [
  {
    label: "Bank receipt payments (no card needed)",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "x" },
    diy: { kind: "partial", label: "Manual" },
  },
  {
    label: "WhatsApp ticket delivery",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "x" },
    diy: { kind: "check" },
  },
  {
    label: "AI fraud detection on receipts",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "x" },
    diy: { kind: "x" },
  },
  {
    label: "AI readiness coach",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "x" },
    diy: { kind: "x" },
  },
  {
    label: "AI demand forecast & pace alerts",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "x" },
    diy: { kind: "x" },
  },
  {
    label: "Multi-island coverage",
    we: { kind: "text", label: "12 islands" },
    taack: { kind: "text", label: "T&T only" },
    island: { kind: "text", label: "3 islands" },
    eventbrite: { kind: "text", label: "Global (USD)" },
    diy: { kind: "x" },
  },
  {
    label: "Local currency (TTD, JMD, BBD, XCD…)",
    we: { kind: "check" },
    taack: { kind: "partial", label: "TTD" },
    island: { kind: "partial", label: "TTD" },
    eventbrite: { kind: "partial", label: "USD" },
    diy: { kind: "check" },
  },
  {
    label: "Group ticketing (split with crew)",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "partial" },
    eventbrite: { kind: "check" },
    diy: { kind: "x" },
  },
  {
    label: "Offline door scanner",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "check" },
    diy: { kind: "x" },
  },
  {
    label: "Apple & Google Wallet passes",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "check" },
    diy: { kind: "x" },
  },
  {
    label: "Verified promoter trust system",
    we: { kind: "check" },
    taack: { kind: "x" },
    island: { kind: "x" },
    eventbrite: { kind: "partial" },
    diy: { kind: "x" },
  },
  {
    label: "Built for Caribbean carnival culture",
    we: { kind: "check" },
    taack: { kind: "partial" },
    island: { kind: "partial" },
    eventbrite: { kind: "x" },
    diy: { kind: "check" },
  },
];

function ComparisonCell({ value, highlight = false }: { value: Cell; highlight?: boolean }) {
  const base = `px-4 py-3 text-center ${highlight ? "bg-brand-red/[0.04]" : ""}`;
  if (value.kind === "check") {
    return (
      <td className={base}>
        <Check className={`mx-auto h-4 w-4 ${highlight ? "text-brand-red" : "text-foreground/80"}`} aria-label="Included" />
      </td>
    );
  }
  if (value.kind === "x") {
    return (
      <td className={base}>
        <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not offered" />
      </td>
    );
  }
  if (value.kind === "partial") {
    return (
      <td className={base}>
        <div className="flex flex-col items-center gap-0.5">
          <Minus className="h-4 w-4 text-muted-foreground" aria-label="Limited" />
          {value.label ? <span className="text-[10px] text-muted-foreground">{value.label}</span> : null}
        </div>
      </td>
    );
  }
  return (
    <td className={base}>
      <span className={`text-xs ${highlight ? "font-semibold text-brand-red" : "text-muted-foreground"}`}>
        {value.label}
      </span>
    </td>
  );
}

const promoterQuotes = [
  {
    name: "Kerlon",
    role: "soca DJ & promoter",
    quote:
      "I used to be five WhatsApps deep at 2am verifying receipts. Now I sleep. The AI does it.",
  },
  {
    name: "Tamika",
    role: "event promoter, POS",
    quote:
      "Readiness score told me my flyer wasn't ready. Fixed it, sold out two weeks early.",
  },
];

export default function HomePage() {
  return (
    <>
      <MidnightMasHero />

      {/* Trust strip — high above the fold, no logos required */}
      <section className="border-b border-border/60 bg-foreground/[0.02]">
        <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
            12 Caribbean islands
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
            Bank transfer + WhatsApp delivery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
            AI fraud detection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
            100% buyer protection
          </span>
        </div>
      </section>

      {/* Quick island shortcuts — direct entry for non-T&T cold traffic */}
      <section className="border-b border-border/60 py-6">
        <div className="container">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Browse by island:
            </span>
            {ISLANDS.slice(0, 8).map((isl) => (
              <Link
                key={isl.code}
                href={`/discover?island=${isl.code}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-foreground hover:bg-muted hover:text-foreground"
              >
                <span aria-hidden>{isl.flag}</span>
                {isl.name}
              </Link>
            ))}
            <Link
              href="/discover"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              See all 12 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured events — most important CRO element for cold traffic */}
      <FeaturedEventsStrip />

      <Section className="border-b border-border/60">
        <div className="grid gap-4 md:grid-cols-3">
          {trustSignals.map(({ Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            Two sides, one platform. Pick yours.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">For buyers</Badge>
              <CardTitle>Get to the fete in 3 steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerSteps.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white">
                    {s.n}
                  </div>
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{s.body}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">For promoters</Badge>
              <CardTitle>Launch your event in 3 steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {promoterSteps.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {s.n}
                  </div>
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{s.body}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* What we are — AI ticket business description */}
      <Section className="border-y border-border/60 bg-gradient-to-b from-background to-muted/20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="outline" className="mb-4 w-fit">
              <Brain className="mr-1.5 h-3.5 w-3.5" aria-hidden /> AI ticketing platform
            </Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              The Caribbean&apos;s first AI-powered ticket platform.
            </h2>
            <p className="mt-4 text-muted-foreground">
              WeFetePass is built for how Caribbean fetes actually run — bank transfers,
              WhatsApp drops, and last-minute door chaos. Our AI handles the boring stuff
              so promoters can focus on the vibes, and buyers can trust the QR code in
              their pocket.
            </p>
            <p className="mt-3 text-muted-foreground">
              From Trinidad Carnival to Crop Over to Reggae Sumfest — one platform,
              twelve islands, every fete.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline">🇹🇹 Trinidad</Badge>
              <Badge variant="outline">🇯🇲 Jamaica</Badge>
              <Badge variant="outline">🇧🇧 Barbados</Badge>
              <Badge variant="outline">🇬🇩 Grenada</Badge>
              <Badge variant="outline">🇱🇨 St. Lucia</Badge>
              <Badge variant="outline">+ 7 more</Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aiCapabilities.map(({ Icon, title, body }) => (
              <Card key={title} className="border-brand-red/10">
                <CardHeader className="space-y-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-sm">{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Why pick us — comparison chart */}
      <Section>
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Why pick WeFetePass.
          </h2>
          <p className="mt-3 text-muted-foreground">
            How we stack up against the platforms Caribbean promoters use today.
          </p>
        </div>

        <Card className="overflow-hidden border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-4 text-left font-semibold">Feature</th>
                  <th className="px-4 py-4 text-center font-semibold text-brand-red">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>WeFetePass</span>
                      <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">Built for the Caribbean</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">Taack</th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">Island eTickets</th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">Eventbrite</th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">DIY / WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border/40 ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <ComparisonCell value={row.we} highlight />
                    <ComparisonCell value={row.taack} />
                    <ComparisonCell value={row.island} />
                    <ComparisonCell value={row.eventbrite} />
                    <ComparisonCell value={row.diy} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-brand-red" aria-hidden /> Included
            </span>
            <span className="flex items-center gap-1.5">
              <Minus className="h-3.5 w-3.5" aria-hidden /> Limited
            </span>
            <span className="flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" aria-hidden /> Not offered
            </span>
          </div>
          <Link href="/compare" className="underline-offset-2 hover:underline">
            See full comparison →
          </Link>
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built for both sides of the party
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every feature serves the buyer experience and the promoter workflow.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground/5">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            What people are saying
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...buyerQuotes, ...promoterQuotes].map((q) => (
            <Card key={q.name}>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed">&ldquo;{q.quote}&rdquo;</p>
                <div className="mt-4 text-xs font-medium">
                  {q.name}
                  <span className="text-muted-foreground"> — {q.role}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ — answers cold-traffic objections before the final CTA */}
      <Section className="border-t border-border/60">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Common questions.</h2>
          <p className="mt-3 text-muted-foreground">
            What every first-time buyer wants to know before they click Pay.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-lg border border-border/60 p-5">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border/60 bg-gradient-to-b from-muted/30 to-background">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready when you are.</h2>
          <p className="mt-3 text-muted-foreground">Pick your side and let&apos;s go.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-brand-red/20">
            <CardHeader>
              <Badge variant="outline" className="w-fit">Party goers</Badge>
              <CardTitle className="font-display text-2xl">Find your next fete.</CardTitle>
              <CardDescription>Browse events, pay by bank transfer, get your QR ticket.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
                <Link href="/discover">
                  Explore events <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">Promoters</Badge>
              <CardTitle className="font-display text-2xl">Your next event, fully loaded.</CardTitle>
              <CardDescription>Tickets, flyers, VIP, door ops, and AI tools — all in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-up?role=promoter">
                  Apply to sell tickets <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <StickyMobileCTA />
    </>
  );
}
