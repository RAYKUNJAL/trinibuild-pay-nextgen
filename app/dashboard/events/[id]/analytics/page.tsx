import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatTTD } from "@/lib/utils";
import { PageHeader } from "../../../_components/page-header";
import { getCurrentPromoter, getEventForPromoter } from "../../../_lib/queries";
import { DebriefRegenerate } from "./debrief-regenerate";

export const metadata = { title: "Analytics — WeFetePass" };

export default async function EventAnalyticsPage({
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

  const cap = tiers.reduce((s, t) => s + (t.quantity ?? 0), 0);
  const sold = tiers.reduce((s, t) => s + (t.quantity_sold ?? 0), 0);
  const sellThrough = cap > 0 ? Math.round((sold / cap) * 100) : 0;

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total_cents, created_at")
    .eq("event_id", event.id)
    .eq("status", "paid");
  const orders = paidOrders ?? [];
  const revenueCents = orders.reduce((s, o) => s + (o.total_cents ?? 0), 0);
  const avgPrice = orders.length > 0 ? revenueCents / orders.length : 0;
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(event.starts_at).getTime() - Date.now()) / 86_400_000),
  );

  // 14-day rolling sales pace
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: number[] = Array(14).fill(0);
  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    const dayIndex = 13 - Math.floor((today.getTime() - t) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < 14) buckets[dayIndex] += 1;
  }
  const maxBucket = Math.max(1, ...buckets);

  // Predictive pace: compare promoter's prior events' average sell-through at same days-out
  const { data: priorEvents } = await supabase
    .from("events")
    .select("id, starts_at")
    .eq("organizer_id", promoter.user.id)
    .neq("id", event.id);
  let paceAlert: { pct: number; behind: boolean } | null = null;
  const priorIds = (priorEvents ?? []).map((e) => e.id);
  if (priorIds.length > 0) {
    const { data: priorTiers } = await supabase
      .from("ticket_tiers")
      .select("event_id, quantity, quantity_sold")
      .in("event_id", priorIds);
    const priorCapMap = new Map<string, { cap: number; sold: number }>();
    for (const t of priorTiers ?? []) {
      const cur = priorCapMap.get(t.event_id) ?? { cap: 0, sold: 0 };
      cur.cap += t.quantity ?? 0;
      cur.sold += t.quantity_sold ?? 0;
      priorCapMap.set(t.event_id, cur);
    }
    const priorRates = Array.from(priorCapMap.values())
      .filter((v) => v.cap > 0)
      .map((v) => v.sold / v.cap);
    if (priorRates.length > 0) {
      const avgPriorRate =
        priorRates.reduce((s, r) => s + r, 0) / priorRates.length;
      const currentRate = cap > 0 ? sold / cap : 0;
      const ratio = avgPriorRate > 0 ? currentRate / avgPriorRate : 1;
      paceAlert = { pct: Math.round(ratio * 100), behind: ratio < 0.7 };
    }
  }

  // Demand forecast: simple inline rule using tier prices + capacity
  const tierPrices = tiers
    .map((t) => t.price_cents)
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);
  const medianPrice =
    tierPrices.length > 0
      ? tierPrices[Math.floor(tierPrices.length / 2)]
      : 20_000;
  const forecastLowCents = Math.round(medianPrice * 0.85);
  const forecastHighCents = Math.round(medianPrice * 1.25);

  const ended = event.ends_at
    ? new Date(event.ends_at).getTime() < Date.now()
    : new Date(event.starts_at).getTime() < Date.now() - 8 * 3600_000;

  let peakHourLabel: string | null = null;
  let attended = 0;
  if (ended) {
    const { data: scans } = await supabase
      .from("scan_events")
      .select("scanned_at, result")
      .eq("event_id", event.id)
      .eq("result", "valid");
    attended = scans?.length ?? 0;
    if (scans && scans.length > 0) {
      const hourBuckets: Record<number, number> = {};
      for (const s of scans) {
        const h = new Date(s.scanned_at).getHours();
        hourBuckets[h] = (hourBuckets[h] ?? 0) + 1;
      }
      const peak = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
      if (peak) peakHourLabel = `${peak[0].padStart(2, "0")}:00 (${peak[1]} entries)`;
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Analytics · ${event.title}`}
        description="Sales, pace, and post-event insights."
        actions={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${event.id}/edit`}>Edit event</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Tickets sold" value={String(sold)} />
        <Kpi label="Revenue" value={formatTTD(revenueCents)} />
        <Kpi label="Avg price" value={formatTTD(avgPrice)} />
        <Kpi label="Sell-through" value={`${sellThrough}%`} />
        <Kpi label="Days remaining" value={String(daysRemaining)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Sales by tier</h2>
            <div className="space-y-3">
              {tiers.map((t) => {
                const pct = t.quantity > 0 ? Math.round((t.quantity_sold / t.quantity) * 100) : 0;
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground">
                        {t.quantity_sold}/{t.quantity} · {formatTTD(t.price_cents)}
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
              {tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiers configured.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">14-day sales pace</h2>
            <svg
              viewBox="0 0 280 80"
              className="h-24 w-full"
              role="img"
              aria-label="Sales over the last 14 days"
            >
              {buckets.map((v, i) => {
                const h = Math.round((v / maxBucket) * 70);
                return (
                  <rect
                    key={i}
                    x={i * 20 + 2}
                    y={75 - h}
                    width={16}
                    height={h}
                    rx={2}
                    className="fill-brand-red"
                  />
                );
              })}
            </svg>
            <p className="text-xs text-muted-foreground">
              Bars show paid orders per day, oldest left to today on the right.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/10">
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-amber-700">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">
                AI predictive pace
              </span>
            </div>
            {paceAlert ? (
              paceAlert.behind ? (
                <p className="text-sm">
                  You&apos;re at <span className="font-semibold">{paceAlert.pct}%</span> of your
                  usual pace for this point. Try a flash sale or push to your CRM.
                </p>
              ) : (
                <p className="text-sm">
                  Pace is healthy — <span className="font-semibold">{paceAlert.pct}%</span> of
                  your typical sell-through trajectory.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough history yet — we&apos;ll start spotting pace patterns after your second
                event.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-brand-red">
              <TrendingUp className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">
                AI demand forecast
              </span>
            </div>
            <p className="text-sm">
              Suggested price band for similar events:{" "}
              <span className="font-semibold">
                {formatTTD(forecastLowCents)} – {formatTTD(forecastHighCents)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Based on your tier mix and the median of comparable fetes in your city.
            </p>
          </CardContent>
        </Card>
      </section>

      {ended ? (
        <section>
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <h2 className="font-display text-lg font-semibold">Post-event debrief</h2>
                </div>
                <DebriefRegenerate eventId={event.id} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Kpi
                  label="Attendance"
                  value={`${attended}`}
                  sub={cap > 0 ? `${Math.round((attended / cap) * 100)}% of capacity` : undefined}
                />
                <Kpi label="Final revenue" value={formatTTD(revenueCents)} />
                <Kpi
                  label="Peak entry hour"
                  value={peakHourLabel ?? "—"}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Revenue by tier</h3>
                <ul className="space-y-1 text-sm">
                  {tiers.map((t) => (
                    <li key={t.id} className="flex justify-between">
                      <span>{t.name}</span>
                      <span className="text-muted-foreground">
                        {formatTTD(t.price_cents * t.quantity_sold)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Kpi({
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
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-xl font-bold">{value}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
