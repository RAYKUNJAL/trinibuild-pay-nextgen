import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RevenueTier {
  tier_id: string;
  tier_name: string;
  quantity_sold: number;
  revenue_cents: number;
}

interface DebriefReport {
  event_id: string;
  generated_at: string;
  total_passes: number;
  scanned_passes: number;
  attendance_pct: number;
  no_show_count: number;
  revenue_by_tier: RevenueTier[];
  total_revenue_cents: number;
  peak_entry_hour: number | null;
  peak_entry_hour_count: number;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id, title, starts_at, ends_at")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const service = await createServiceClient();

    // Total passes for event
    const { count: totalPasses } = await service
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    // Scanned (used) passes
    const { count: scannedPasses } = await service
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "used");

    // No-show: still 'valid' after event ended
    const now = new Date().toISOString();
    const eventEnded = event.ends_at ? event.ends_at < now : event.starts_at < now;
    let noShowCount = 0;
    if (eventEnded) {
      const { count: noShows } = await service
        .from("passes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "valid");
      noShowCount = noShows ?? 0;
    }

    const total = totalPasses ?? 0;
    const scanned = scannedPasses ?? 0;
    const attendancePct = total > 0 ? Math.round((scanned / total) * 100) : 0;

    // Revenue by tier: join orders (paid) + order_items + ticket_tiers
    const { data: orderItems } = await service
      .from("order_items")
      .select("tier_id, quantity, unit_price_cents, orders!inner(status, event_id)")
      .eq("orders.event_id", eventId)
      .eq("orders.status", "paid");

    const tierRevMap = new Map<string, { quantity: number; revenue: number }>();
    for (const item of orderItems ?? []) {
      const existing = tierRevMap.get(item.tier_id) ?? { quantity: 0, revenue: 0 };
      tierRevMap.set(item.tier_id, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.unit_price_cents * item.quantity,
      });
    }

    // Fetch tier names
    const tierIds = Array.from(tierRevMap.keys());
    let tierNameMap = new Map<string, string>();
    if (tierIds.length > 0) {
      const { data: tiers } = await service
        .from("ticket_tiers")
        .select("id, name")
        .in("id", tierIds);
      for (const tier of tiers ?? []) {
        tierNameMap.set(tier.id, tier.name);
      }
    }

    const revenueByTier: RevenueTier[] = Array.from(tierRevMap.entries()).map(([tierId, data]) => ({
      tier_id: tierId,
      tier_name: tierNameMap.get(tierId) ?? "Unknown",
      quantity_sold: data.quantity,
      revenue_cents: data.revenue,
    }));

    const totalRevenueCents = revenueByTier.reduce((sum, t) => sum + t.revenue_cents, 0);

    // Peak entry hour: hour UTC with most scan_events result='valid'
    const { data: scanRows } = await service
      .from("scan_events")
      .select("scanned_at")
      .eq("event_id", eventId)
      .eq("result", "valid");

    const hourCounts = new Map<number, number>();
    for (const row of scanRows ?? []) {
      const hour = new Date(row.scanned_at).getUTCHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }

    let peakHour: number | null = null;
    let peakHourCount = 0;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > peakHourCount) {
        peakHour = hour;
        peakHourCount = count;
      }
    }

    const report: DebriefReport = {
      event_id: eventId,
      generated_at: now,
      total_passes: total,
      scanned_passes: scanned,
      attendance_pct: attendancePct,
      no_show_count: noShowCount,
      revenue_by_tier: revenueByTier,
      total_revenue_cents: totalRevenueCents,
      peak_entry_hour: peakHour,
      peak_entry_hour_count: peakHourCount,
    };

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[POST /api/events/[id]/debrief]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
