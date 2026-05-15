import Link from "next/link";
import type { Metadata } from "next";
import {
  Search,
  Banknote,
  QrCode,
  MessageCircle,
  PartyPopper,
  ClipboardCheck,
  Sparkles,
  ScanLine,
  Wallet,
  ArrowRight,
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

export const metadata: Metadata = {
  title: "How WeFetePass works — for fete-goers and promoters",
  description:
    "Step-by-step: how to find a fete, pay, and get your QR ticket. And how promoters launch, sell, and run the door on WeFetePass.",
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

const buyerSteps = [
  {
    Icon: Search,
    title: "Find a fete",
    body: "Browse Carnival events, J'Ouvert, all-inclusives, and more. Filter by date, vibe, or venue.",
  },
  {
    Icon: Banknote,
    title: "Pay by bank transfer",
    body: "Transfer from Republic, Scotia, or FCB. Upload your receipt — we verify it in seconds.",
  },
  {
    Icon: MessageCircle,
    title: "Ticket on WhatsApp",
    body: "Your QR ticket lands straight in your chats. No printing, no fumbling at the gate.",
  },
  {
    Icon: QrCode,
    title: "Scan in at the door",
    body: "Show the QR, hear the beep, walk in. One scan, you done.",
  },
  {
    Icon: PartyPopper,
    title: "Fete in peace",
    body: "Your ticket lives in your wallet. Past fetes and upcoming ones, all in one place.",
  },
];

const promoterSteps = [
  {
    Icon: ClipboardCheck,
    title: "Apply to sell tickets",
    body: "Quick onboarding form. We verify and set you up with your hosted event page.",
  },
  {
    Icon: Sparkles,
    title: "Build your event",
    body: "Pick an AI flyer, set your tiers, generate VIP codes. Readiness Score keeps you on track.",
  },
  {
    Icon: Banknote,
    title: "Sell tickets, verified",
    body: "Buyers pay by bank transfer. Our AI checks every receipt and flags fakes automatically.",
  },
  {
    Icon: ScanLine,
    title: "Run the door",
    body: "Our trained scanner team scans QRs at the gate. Real-time count, no chaos.",
  },
  {
    Icon: Wallet,
    title: "Get paid weekly",
    body: "Payouts go straight to your T&T bank. Plus a post-event debrief on what worked.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container py-16 md:py-24">
          <Badge variant="outline" className="mb-4">How it works</Badge>
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Two sides. One platform. Pick yours below.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            WeFetePass is built for both party goers and promoters. Whatever side you&apos;re on, it&apos;s a few simple steps.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="#for-party-goers">For Party Goers</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#for-promoters">For Promoters</Link>
            </Button>
          </div>
        </div>
      </section>

      <Section id="for-party-goers">
        <div className="mb-10 max-w-2xl">
          <Badge variant="outline" className="mb-3">For Party Goers</Badge>
          <h2 className="font-display text-3xl font-bold md:text-4xl">From browsing to beep — in 5 steps.</h2>
          <p className="mt-3 text-muted-foreground">
            No card needed. No email needed. Just your phone and a bank transfer.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {buyerSteps.map((s, i) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white">
                    {i + 1}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                    <s.Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <CardDescription>{s.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild size="lg" className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/discover">
              Explore events <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <Section id="for-promoters" className="bg-muted/30">
        <div className="mb-10 max-w-2xl">
          <Badge variant="outline" className="mb-3">For Promoters</Badge>
          <h2 className="font-display text-3xl font-bold md:text-4xl">From application to payout — in 5 steps.</h2>
          <p className="mt-3 text-muted-foreground">
            One platform replaces five tools. Apply, launch, scan, get paid.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {promoterSteps.map((s, i) => (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {i + 1}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground/5">
                    <s.Icon className="h-5 w-5" aria-hidden />
                  </div>
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <CardDescription>{s.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up?role=promoter">
              Apply to sell tickets <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
