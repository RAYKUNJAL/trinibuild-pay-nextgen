import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { formatTTD } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };

type Params = { eventId: string };
type SP = { orderId?: string };

type Order = {
  id: string;
  total_cents: number;
  status: string;
  buyer_phone: string | null;
  events: { title: string; slug: string } | null;
};

type Pass = {
  id: string;
  code: string;
  holder_name: string | null;
  ticket_tiers: { name: string } | null;
};

function maskPhone(phone: string | null): string {
  if (!phone) return "your WhatsApp";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `+${digits.slice(0, digits.length - 4).replace(/.(?=.{2})/g, "x")}${digits.slice(-4)}`;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  await params;
  const sp = await searchParams;
  if (!sp.orderId) notFound();

  const supabase = await createClient();
  const { data: orderData } = await supabase
    .from("orders")
    .select("id, total_cents, status, buyer_phone, events:event_id(title, slug)")
    .eq("id", sp.orderId)
    .maybeSingle();
  const order = orderData as unknown as Order | null;
  if (!order) notFound();

  const { data: passesData } = await supabase
    .from("passes")
    .select("id, code, holder_name, ticket_tiers:tier_id(name)")
    .eq("order_id", order.id);
  const passes = (passesData ?? []) as unknown as Pass[];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="You're in."
        description={`Tickets sent to your WhatsApp at ${maskPhone(order.buyer_phone)}.`}
      />
      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
            <div>
              <div className="font-display text-lg font-semibold">{order.events?.title}</div>
              <div className="text-sm text-muted-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()} · {formatTTD(order.total_cents)}
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <h2 className="font-display text-base font-semibold">Your passes</h2>
          {passes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Passes will appear in your wallet once payment clears.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {passes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{p.ticket_tiers?.name ?? "General"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.holder_name ?? "Guest"} · {p.code}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/wallet/${p.id}`}>View pass</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/wallet">Open my wallet</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/discover">Find more fetes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
