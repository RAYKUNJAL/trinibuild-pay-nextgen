"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// NOTE: WhatsApp Business link is a placeholder. Set the real number via
// NEXT_PUBLIC_WHATSAPP_SUPPORT_URL (or similar env var) before launch.
const WHATSAPP_SUPPORT_URL = "https://wa.me/18680000000";

const buyerFaq: { q: string; a: string }[] = [
  {
    q: "How do I get my ticket?",
    a: "Once your bank receipt is verified, your QR ticket is sent straight to your WhatsApp. It also lives in your WeFetePass wallet under Orders.",
  },
  {
    q: "My bank transfer didn't show — what now?",
    a: "Transfers can take 5–30 minutes to reflect. If it's been longer, message us on WhatsApp with your receipt and the event name — we'll trace it.",
  },
  {
    q: "What's the refund policy?",
    a: "Refunds are set by each promoter. Check the event page for the specific policy. For verified issues (event cancelled, duplicate charge), we'll process a full refund.",
  },
  {
    q: "What if I lose my QR?",
    a: "Open your WeFetePass wallet on any device — your QR is there. You can also re-send to WhatsApp from the order page.",
  },
  {
    q: "Can I transfer my ticket to a friend?",
    a: "Yes — open the ticket in your wallet and tap Transfer. The new QR is sent to your friend's WhatsApp and yours is invalidated.",
  },
  {
    q: "Can I book for a group?",
    a: "Yes. Buy multiple tickets in one order, send each QR to a different WhatsApp number, or request payment from your crew.",
  },
];

const promoterFaq: { q: string; a: string }[] = [
  {
    q: "How do I apply to sell tickets?",
    a: "Tap Apply to sell tickets and fill the short form. We verify and onboard most promoters within 1–2 business days.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts run weekly, straight to your Trinidad bank account (Republic, Scotia, FCB, and others).",
  },
  {
    q: "How is receipt fraud handled?",
    a: "Every bank receipt is scored by our AI: Low, Medium, High, or Auto-reject. High-risk receipts are flagged for your review before the ticket is issued.",
  },
  {
    q: "How does the scanner team work?",
    a: "We provide a trained scanner team using the WeFetePass scanner app — or your own crew can use it. Real-time entry count, dupe detection, and offline mode.",
  },
  {
    q: "How do I generate VIP codes?",
    a: "Create codes from your event dashboard — single-use or multi-use, percentage or flat discount. Each redemption is tracked.",
  },
  {
    q: "Are there any hosting fees?",
    a: "No. Your event page, AI flyer, VIP codes, scanner team, and CRM are all included in the 7.5% platform fee.",
  },
];

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
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
  );
}

export default function SupportPage() {
  const [audience, setAudience] = useState<"buyer" | "promoter">("buyer");

  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="container py-16 md:py-20">
          <Badge variant="outline" className="mb-4">Support</Badge>
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            We&apos;re here when you need us.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Most questions are answered below. If you need a human, WhatsApp is the fastest path.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-8 inline-flex rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setAudience("buyer")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                audience === "buyer"
                  ? "bg-brand-red text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Party goers
            </button>
            <button
              type="button"
              onClick={() => setAudience("promoter")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                audience === "promoter"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Promoters
            </button>
          </div>

          <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
            <div>
              <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">
                {audience === "buyer" ? "Buyer FAQ" : "Promoter FAQ"}
              </h2>
              <Faq items={audience === "buyer" ? buyerFaq : promoterFaq} />
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                  <CardDescription>Fastest reply, T&amp;T hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
                    <a href={WHATSAPP_SUPPORT_URL} target="_blank" rel="noreferrer noopener">
                      Message us <ArrowRight aria-hidden />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground/5">
                    <Mail className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">Email</CardTitle>
                  <CardDescription>For longer issues with attachments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="mailto:help@wefetepass.com"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    help@wefetepass.com
                  </a>
                </CardContent>
              </Card>

              <Card className="border-brand-red/20">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">AI Concierge</CardTitle>
                  <CardDescription>
                    Get instant answers about your tickets, orders, or event setup.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href="/support/concierge">
                      Try the concierge <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
