import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type EventAnalytics = {
  ticketsSold: number;
  capacity: number;
  sellThroughPct: number;
  revenueCents: number;
  avgTicketPriceCents: number;
  salesByTier: {
    tierId: string;
    tierName: string;
    sold: number;
    revenueCents: number;
  }[];
  salesPace: { date: string; cumulative: number }[]; // last 14 days
  scanEvents: { hour: number; count: number }[]; // entry counts by hour of day
};

type SupabaseDb = SupabaseClient<Database>;

// Local row aliases so Supabase generic narrowing doesn't collapse to `never`
// when only a subset of columns are selected.
type TierRow = Pick<
  Database["public"]["Tables"]["ticket_tiers"]["Row"],
  "id" | "name" | "quantity" | "quantity_sold" | "price_cents"
>;
type OrderRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  "subtotal_cents" | "created_at"
>;
type ScanRow = Pick<
  Database["public"]["Tables"]["scan_events"]["Row"],
  "scanned_at"
>;

/**
 * Aggregate event analytics for the promoter dashboard.
 *
 * Queries:
 *  - ticket_tiers  → capacity, tier breakdown
 *  - orders        → revenue (paid orders only)
 *  - passes        → tickets sold count per tier
 *  - scan_events   → peak entry by hour
 *
 * salesPace is derived JS-side by grouping orders by date (last 14 days).
 * A Supabase RPC would be faster at scale — TODO: replace with
 *   rpc('event_sales_pace', { event_id, days: 14 })
 * once that function is created.
 */
export async function getEventAnalytics(
  eventId: string,
  supabase: SupabaseDb,
): Promise<EventAnalytics> {
  // ── 1. Tier capacity & names ───────────────────────────────────────────────
  const { data: tiers, error: tierErr } = await supabase
    .from("ticket_tiers")
    .select("id, name, quantity, quantity_sold, price_cents")
    .eq("event_id", eventId);

  if (tierErr) throw new Error(`analytics/tiers: ${tierErr.message}`);

  const typedTiers = (tiers ?? []) as TierRow[];
  const capacity = typedTiers.reduce((s, t) => s + t.quantity, 0);
  const ticketsSold = typedTiers.reduce((s, t) => s + t.quantity_sold, 0);
  const sellThroughPct =
    capacity > 0 ? Math.round((ticketsSold / capacity) * 100) : 0;

  // ── 2. Revenue from paid orders ────────────────────────────────────────────
  const { data: orders, error: ordErr } = await supabase
    .from("orders")
    .select("subtotal_cents, created_at")
    .eq("event_id", eventId)
    .eq("status", "paid");

  if (ordErr) throw new Error(`analytics/orders: ${ordErr.message}`);

  const typedOrders = (orders ?? []) as OrderRow[];
  const revenueCents = typedOrders.reduce((s, o) => s + o.subtotal_cents, 0);
  const avgTicketPriceCents =
    ticketsSold > 0 ? Math.round(revenueCents / ticketsSold) : 0;

  // ── 3. Sales by tier ───────────────────────────────────────────────────────
  const salesByTier = typedTiers.map((tier) => ({
    tierId:       tier.id,
    tierName:     tier.name,
    sold:         tier.quantity_sold,
    revenueCents: tier.quantity_sold * tier.price_cents,
  }));

  // ── 4. Sales pace — last 14 days, grouped by date ─────────────────────────
  // TODO: replace JS-side grouping with a Supabase RPC for large event volumes.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffIso = cutoff.toISOString();

  const { data: recentOrders, error: paceErr } = await supabase
    .from("orders")
    .select("created_at")
    .eq("event_id", eventId)
    .eq("status", "paid")
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: true });

  if (paceErr) throw new Error(`analytics/pace: ${paceErr.message}`);

  // Group by date string (YYYY-MM-DD) and build cumulative series
  const countByDate = new Map<string, number>();
  for (const o of (recentOrders ?? []) as OrderRow[]) {
    const date = o.created_at.slice(0, 10);
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  // Fill in all 14 days so the chart has no gaps, then make cumulative
  const dateLabels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  let running = 0;
  const salesPace = dateLabels.map((date) => {
    running += countByDate.get(date) ?? 0;
    return { date, cumulative: running };
  });

  // ── 5. Scan events by hour ─────────────────────────────────────────────────
  // TODO: push hour extraction into a Supabase RPC if scan volume is high.
  const { data: scans, error: scanErr } = await supabase
    .from("scan_events")
    .select("scanned_at")
    .eq("event_id", eventId)
    .eq("result", "valid");

  if (scanErr) throw new Error(`analytics/scans: ${scanErr.message}`);

  const countByHour = new Map<number, number>();
  for (const s of (scans ?? []) as ScanRow[]) {
    const hour = new Date(s.scanned_at).getHours();
    countByHour.set(hour, (countByHour.get(hour) ?? 0) + 1);
  }

  const scanEvents = Array.from(countByHour.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return {
    ticketsSold,
    capacity,
    sellThroughPct,
    revenueCents,
    avgTicketPriceCents,
    salesByTier,
    salesPace,
    scanEvents,
  };
}
