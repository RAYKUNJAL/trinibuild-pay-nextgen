import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { formatTTD, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order detail" };

type Params = { id: string };

type Order = {
  id: string;
  subtotal_cents: number;
  fee_cents: number;
  total_cents: number;
  status: "pending" | "paid" | "refunded" | "cancelled";
  payment_provider: string;
  created_at: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  event_id: string;
  events: { title: string; slug: string; starts_at: string; venue: string } | null;
};

type Pass = {
  id: string;
  code: string;
  status: "valid" | "used" | "voided";
  holder_name: string | null;
  ticket_tiers: { name: string } | null;
};

const statusVariant: Record<Order["status"], { label: string; className: string }> = {
  pending: { label: "Pending payment", className: "bg-amber-100 text-amber-900" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-900" },
  refunded: { label: "Refunded", className: "bg-zinc-200 text-zinc-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-900" },
};

export default async function OrderDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orderData } = await supabase
    .from("orders")
    .select(
      "id, subtotal_cents, fee_cents, total_cents, status, payment_provider, created_at, buyer_email, buyer_phone, event_id, events:event_id(title, slug, starts_at, venue)",
    )
    .eq("id", id)
    .maybeSingle();

  const order = orderData as unknown as Order | null;
  if (!order) notFound();

  const { data: passesData } = await supabase
    .from("passes")
    .select("id, code, status, holder_name, ticket_tiers:tier_id(name)")
    .eq("order_id", order.id);

  const passes = (passesData ?? []) as unknown as Pass[];
  const variant = statusVariant[order.status];
  const refundEligible = order.status === "paid";

  return (
    <>
      <PageHeader title={`Order #${order.id.slice(0, 8).toUpperCase()}`} description={order.events?.title} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Payment</h2>
              <Badge className={variant.className}>{variant.label}</Badge>
            </div>
            <Separator className="my-4" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatTTD(order.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Platform fee</dt>
                <dd>{formatTTD(order.fee_cents)}</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatTTD(order.total_cents)}</dd>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <dt>Paid via</dt>
                <dd>{order.payment_provider}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Ordered</dt>
                <dd>{formatDateTime(order.created_at)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                {/* TODO(api): GET /api/orders/[id]/receipt — handled by another agent */}
                <Link href={`/api/orders/${order.id}/receipt`}>Download receipt</Link>
              </Button>
              {refundEligible ? (
                <Button asChild variant="outline" size="sm">
                  {/* TODO(api): POST /api/orders/[id]/refund-request — handled by another agent */}
                  <Link href={`/support?orderId=${order.id}&topic=refund`}>Request refund</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold">Tickets in this order</h2>
            {passes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Passes will appear here once payment clears.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {passes.map((p) => (
                  <li key={p.id} className="rounded-md border border-border/60 p-3">
                    <div className="text-sm font-semibold">{p.ticket_tiers?.name ?? "General"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.holder_name ?? "Guest"} · {p.code}
                    </div>
                    <div className="mt-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/wallet/${p.id}`}>View pass</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
