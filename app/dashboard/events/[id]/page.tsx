import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReadinessMeter } from "@/components/readiness-meter";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTTD } from "@/lib/utils";
import { PageHeader } from "../../_components/page-header";
import { computeReadiness, getCurrentPromoter, getEventForPromoter } from "../../_lib/queries";

export const metadata = { title: "Event — WeFetePass" };

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;
  const data = await getEventForPromoter(id, promoter.user.id);
  if (!data) notFound();
  const { event, tiers } = data;

  const supabase = await createClient();
  const { count: paidOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "paid");
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_cents")
    .eq("event_id", event.id)
    .eq("status", "paid");
  const revenueCents = (paidOrders ?? []).reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const cap = tiers.reduce((s, t) => s + (t.quantity ?? 0), 0);
  const sold = tiers.reduce((s, t) => s + (t.quantity_sold ?? 0), 0);
  const readiness = computeReadiness(event);

  return (
    <div className="space-y-8">
      <PageHeader
        title={event.title}
        description={`${formatDateTime(event.starts_at)} · ${event.venue}, ${event.city}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/events/${event.id}/edit`}>Edit</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/events/${event.id}/analytics`}>Analytics</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/scan?event=${event.id}`}>Scanner</Link>
            </Button>
            <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href={`/events/${event.slug}`}>Public page</Link>
            </Button>
          </div>
        }
      />

      <Card className="border-border/60">
        <CardContent className="p-6">
          <ReadinessMeter score={readiness.score} checks={readiness.checks} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Tickets sold" value={String(sold)} sub={`of ${cap}`} />
        <Metric label="Paid orders" value={String(paidOrdersCount ?? 0)} />
        <Metric label="Revenue" value={formatTTD(revenueCents)} />
        <Metric
          label="Sell-through"
          value={`${cap > 0 ? Math.round((sold / cap) * 100) : 0}%`}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
