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

export const metadata: Metadata = {
  title: "WeFetePass — Trini fete tickets and promoter tools",
  description:
    "Find fetes, pay by bank transfer, get a QR ticket on WhatsApp. Or sell tickets with the platform built for T&T promoters.",
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
              Browse events, pay by bank transfer, get your QR ticket. No stress.
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
    </>
  );
}
