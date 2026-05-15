import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Gauge, Sparkles, LineChart, FileText, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Compare — WeFetePass vs. Generic Ticketing vs. DIY",
  description:
    "Why WeFetePass costs more — and why promoters say it's worth it. See how 7.5% all-in compares to global ticketing platforms and the DIY stack.",
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

type Row = {
  label: string;
  we: string;
  global: string;
  diy: string;
};

const rows: Row[] = [
  {
    label: "Platform fee",
    we: "7.5% all-in",
    global: "5–9% + per-ticket fee",
    diy: "0% — but your time",
  },
  {
    label: "Bank-receipt verification",
    we: "Included (AI)",
    global: "Not available",
    diy: "Manual",
  },
  {
    label: "AI flyer creation",
    we: "Included",
    global: "Not available",
    diy: "Manual",
  },
  {
    label: "Door scanner team",
    we: "Included",
    global: "Not available",
    diy: "Manual",
  },
  {
    label: "VIP code system",
    we: "Included",
    global: "Limited",
    diy: "Manual",
  },
  {
    label: "Buyer CRM ownership",
    we: "Yours, exportable",
    global: "Locked to platform",
    diy: "Yours",
  },
  {
    label: "Payout timing",
    we: "Weekly to T&T bank",
    global: "Post-event, 7–14 days",
    diy: "Whenever you collect",
  },
];

const featureCards = [
  {
    Icon: ShieldCheck,
    title: "AI Receipt Verification",
    body: "Fake receipts flagged in seconds. Low/Medium/High/Auto-reject — no more 2am screenshot detective work.",
  },
  {
    Icon: Gauge,
    title: "Promoter Readiness Score",
    body: "Live 0–100 grade per event across flyer, page, VIPs, payout info, scanners, and social.",
  },
  {
    Icon: Sparkles,
    title: "AI Flyer Generation",
    body: "Pick a base, customize the details, ship in minutes. Built for soca, fete, and Carnival aesthetics.",
  },
  {
    Icon: LineChart,
    title: "AI Demand Forecasting",
    body: "Recommended price ranges from comparable events — venue, season, day-of-week.",
  },
  {
    Icon: FileText,
    title: "Post-Event Debrief",
    body: "Auto-generated insights: attendance curve, revenue by tier, peak entry time, recommendations for next time.",
  },
  {
    Icon: AlarmClock,
    title: "Predictive Pace Alerts",
    body: "Proactive warnings when sales are tracking under your historical average for similar events.",
  },
];

export default function ComparePage() {
  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container py-16 md:py-24">
          <Badge variant="outline" className="mb-4">Compare</Badge>
          <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Why WeFetePass costs more — and why promoters say it&apos;s worth it.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            7.5% looks higher than the global tools — until you add up flyer design, fraud checks, scanner staff, and the hours you&apos;d spend on WhatsApp.
          </p>
        </div>
      </section>

      <Section>
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">How our pricing compares.</h2>
          <p className="mt-3 text-muted-foreground">
            Side-by-side against a generic global ticketing platform and the DIY stack (Google Forms + WhatsApp + manual verification).
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 font-semibold text-brand-red">WeFetePass</th>
                <th className="px-4 py-3 font-semibold">Generic Global Ticketing</th>
                <th className="px-4 py-3 font-semibold">DIY (Forms + WhatsApp + Manual)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="px-4 py-3">{r.we}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.global}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.diy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            What the 7.5% actually buys you.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Six AI-powered features that don&apos;t exist on the generic platforms — and would cost you days of work to replicate.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map(({ Icon, title, body }) => (
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
        <Card className="mx-auto max-w-3xl text-center border-brand-red/20">
          <CardHeader>
            <CardTitle className="font-display text-3xl md:text-4xl">
              Ready to run your next event from one place?
            </CardTitle>
            <CardDescription className="text-base">
              Apply once. Sell tickets, scan the door, get paid weekly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/sign-up?role=promoter">
                Apply to sell tickets <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
