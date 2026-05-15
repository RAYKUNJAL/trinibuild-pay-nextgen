import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatTTD, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders" };

type OrderRow = {
  id: string;
  total_cents: number;
  status: "pending" | "paid" | "refunded" | "cancelled";
  created_at: string;
  events: { title: string; slug: string; starts_at: string } | null;
};

const statusVariant: Record<OrderRow["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-900" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-900" },
  refunded: { label: "Refunded", className: "bg-zinc-200 text-zinc-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-900" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, total_cents, status, created_at, events:event_id(title, slug, starts_at)")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <>
      <PageHeader title="My orders" description="Receipts, payment status, and tickets from every fete you grabbed." />
      {orders.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No orders yet. <Link href="/discover" className="underline">Find a fete</Link>.
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => {
            const variant = statusVariant[o.status];
            return (
              <li key={o.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-display text-lg font-semibold">
                        {o.events?.title ?? "Event"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ordered {formatDateTime(o.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatTTD(o.total_cents)}</div>
                        <Badge className={variant.className}>{variant.label}</Badge>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/orders/${o.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
