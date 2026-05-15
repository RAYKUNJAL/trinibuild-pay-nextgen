import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  Gauge,
  ShieldCheck,
  Users,
  ScanLine,
  Banknote,
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
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Sell tickets in T&T — WeFetePass for Promoters",
  description:
    "Stop juggling five WhatsApp chats and three apps. Tickets, flyers, VIP, door scanning, AI receipt verification, and payouts — 7.5% all in.",
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

const anxieties = [
  {
    title: "Fake receipts at 2am.",
    body: "Our AI flags fraudulent screenshots in seconds — Low, Medium, High, or auto-rejected.",
  },
  {
    title: "No-shows you can't predict.",
    body: "Predictive pace alerts tell you when your event is tracking under your historical average — before it's too late.",
  },
  {
    title: "Getting paid late.",
    body: "Weekly payouts straight to a Trinidad bank. No chasing, no spreadsheets.",
  },
  {
    title: "Chaos at the door.",
    body: "A trained scanner team and one-tap QR scanning keep the line moving.",
  },
];

const features = [
  {
    Icon: Sparkles,
    title: "Stop starting from scratch.",
    body: "Pick a flyer, add your details, done. AI generates the variations.",
  },
  {
    Icon: Gauge,
    title: "Know your event is ready before the gate opens.",
    body: "Live 0–100 Readiness Score across flyer, page, VIPs, payout info, scanners, and social.",
  },
  {
    Icon: ShieldCheck,
    title: "Receipts verified in seconds — fakes flagged automatically.",
    body: "AI receipt fraud detection on every transfer. Low/Medium/High/Auto-reject.",
  },
  {
    Icon: Users,
    title: "Your crowd lives here. Message past attendees in one tap.",
    body: "Promoter CRM with segments and WhatsApp blasts. Own your audience, not a third-party feed.",
  },
  {
    Icon: ScanLine,
    title: "Scan, verify, move the line.",
    body: "A trained scanner team with the WeFetePass app. Beep in, beep out.",
  },
  {
    Icon: Banknote,
    title: "Get paid weekly to a T&T bank account.",
    body: "Republic, Scotia, FCB — straight deposit. No middlemen, no surprises.",
  },
];

export default function PromotersPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container py-16 md:py-24">
          <Badge variant="outline" className="mb-4">For promoters</Badge>
          <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Stop juggling five WhatsApp chats and three apps. Run your whole event from here.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            One platform for tickets, flyers, VIPs, door ops, fraud checks, and payouts — built for T&amp;T promoters.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/sign-up?role=promoter">
                Apply to sell tickets <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#tools">See the tools</Link>
            </Button>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            The things keeping you up at night — handled.
          </h2>
          <p className="mt-3 text-muted-foreground">
            We built WeFetePass after watching promoters drown in DMs. Every feature exists to remove one specific headache.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {anxieties.map((a) => (
            <Card key={a.title}>
              <CardHeader>
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <CardDescription>{a.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="tools" className="bg-muted/30">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Outcomes, not tools.</h2>
          <p className="mt-3 text-muted-foreground">
            Every feature is named for what it does for you on event day.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, body }) => (
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

      <Section id="pricing">
        <Card className="mx-auto max-w-3xl border-brand-red/20">
          <CardHeader className="text-center">
            <Badge variant="outline" className="mx-auto w-fit">Pricing</Badge>
            <CardTitle className="font-display text-4xl md:text-5xl">
              7.5% — everything included.
            </CardTitle>
            <CardDescription className="text-base">
              Flyers, hosted page, VIP codes, scanner team, AI agent, and bank-receipt ticketing. Compare what you&apos;d pay for five separate tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="my-2" />
            <ul className="grid gap-2 py-4 text-sm md:grid-cols-2">
              <li>AI flyer generation</li>
              <li>Hosted event page</li>
              <li>VIP code system</li>
              <li>Bank-receipt verification</li>
              <li>Door scanner team</li>
              <li>Promoter CRM</li>
              <li>Readiness Score</li>
              <li>Weekly TTD payouts</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-4">
              <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
                <Link href="/sign-up?role=promoter">
                  Apply to sell tickets <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/compare">See the comparison</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
