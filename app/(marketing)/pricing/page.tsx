import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Pricing — 7.5% all-in for promoters",
  description:
    "One flat platform fee. AI flyers, VIP codes, scanner team, bank-receipt verification, CRM, and weekly TTD payouts. No hidden costs.",
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

const included = [
  "AI flyer generation",
  "Hosted event page",
  "VIP & promo code system",
  "Bank-receipt verification (AI)",
  "Door scanner team",
  "Promoter CRM with WhatsApp blasts",
  "Readiness Score & pace alerts",
  "Post-event AI debrief",
  "Weekly TTD payouts",
];

const faq = [
  {
    q: "Why a flat 7.5%?",
    a: "It's simple, predictable, and includes everything. No per-ticket fee, no extra charges for flyers, scanning, or fraud checks. You always know what you're paying.",
  },
  {
    q: "Are there hidden fees?",
    a: "No. The 7.5% is all-in. No setup fees, no monthly fees, no per-ticket fees, no scanner app fee, no CRM fee.",
  },
  {
    q: "How do refunds affect the fee?",
    a: "If a buyer is refunded, the platform fee on that ticket is also refunded. You're never out of pocket on cancellations.",
  },
  {
    q: "What about international cards?",
    a: "Our core flow is local bank transfer with AI receipt verification. International card support is on the roadmap; today it's available on request for vetted events.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container py-16 md:py-24">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            One flat fee. Everything included.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            No surprise add-ons, no per-ticket math, no separate scanner or CRM bills.
          </p>
        </div>
      </section>

      <Section>
        <Card className="mx-auto max-w-3xl border-brand-red/20">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-5xl md:text-6xl">7.5%</CardTitle>
            <CardDescription className="text-base">— everything included.</CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="my-2" />
            <ul className="grid gap-2 py-4 text-sm md:grid-cols-2">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
                <Link href="/sign-up?role=promoter">
                  Apply to sell tickets <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section className="bg-muted/30">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Where the 7.5% goes.</h2>
          <p className="mt-3 text-muted-foreground">
            A side-by-side look at what we charge, what you&apos;d pay elsewhere, and what you save.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What we charge</CardTitle>
              <CardDescription>One flat fee, no extras.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                <li>Platform fee: 7.5%</li>
                <li>Scanner team: $0</li>
                <li>AI flyers: $0</li>
                <li>CRM & blasts: $0</li>
                <li>Payouts: $0</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What you&apos;d pay elsewhere</CardTitle>
              <CardDescription>The DIY / generic stack.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-muted-foreground">
                <li>Ticketing platform: 5–9% + per-ticket</li>
                <li>Designer for flyers: TTD per event</li>
                <li>Door staff & scanners: hourly</li>
                <li>Mailchimp / CRM: monthly</li>
                <li>Manual fraud checks: your time</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-brand-red/20">
            <CardHeader>
              <CardTitle className="text-lg">What you save</CardTitle>
              <CardDescription>Time, money, and headaches.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                <li>Hours of receipt-checking on event week</li>
                <li>Designer briefs for every flyer drop</li>
                <li>Standalone scanner app subscriptions</li>
                <li>The audience list you don&apos;t own</li>
                <li>The chaos at the gate</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 font-display text-3xl font-bold md:text-4xl">Pricing FAQ</h2>
          <div className="space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <summary className="cursor-pointer list-none font-medium">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/sign-up?role=promoter">
                Apply to sell tickets <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
