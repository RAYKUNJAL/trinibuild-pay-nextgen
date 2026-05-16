import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { generateDebriefWithLLM } from "@/lib/ai/debrief";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

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

    const { data: profileRaw } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const profile = profileRaw as { role: string } | null;
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: eventRaw } = await supabase
      .from("events")
      .select("id, organizer_id, title, starts_at, ends_at")
      .eq("id", eventId)
      .single();

    const event = eventRaw as Pick<EventRow, "id" | "organizer_id" | "title" | "starts_at" | "ends_at"> | null;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const service = await createServiceClient();

    const { count: totalPasses } = await service
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    const { count: scannedPasses } = await service
      .from("passes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "used");

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

    // Revenue by tier: fetch paid order items for this event
    const { data: orderItemsRaw } = await service
      .from("order_items")
      .select("tier_id, quantity, unit_price_cents, orders!inner(status, event_id)")
      .eq("orders.event_id" as string, eventId)
      .eq("orders.status" as string, "paid");

    const orderItems = (orderItemsRaw ?? []) as Array<{
      tier_id: string;
      quantity: number;
      unit_price_cents: number;
    }>;

    const tierRevMap = new Map<string, { quantity: number; revenue: number }>();
    for (const item of orderItems) {
      const existing = tierRevMap.get(item.tier_id) ?? { quantity: 0, revenue: 0 };
      tierRevMap.set(item.tier_id, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.unit_price_cents * item.quantity,
      });
    }

    const tierIds = Array.from(tierRevMap.keys());
    const tierNameMap = new Map<string, string>();
    if (tierIds.length > 0) {
      const { data: tiersRaw } = await service
        .from("ticket_tiers")
        .select("id, name")
        .in("id", tierIds);
      for (const tier of (tiersRaw ?? []) as { id: string; name: string }[]) {
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

    // Peak entry hour
    const { data: scanRowsRaw } = await service
      .from("scan_events")
      .select("scanned_at")
      .eq("event_id", eventId)
      .eq("result", "valid");

    const scanRows = (scanRowsRaw ?? []) as { scanned_at: string }[];
    const hourCounts = new Map<number, number>();
    for (const row of scanRows) {
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

    const enriched = await generateDebriefWithLLM({
      eventTitle: event.title,
      startedAt: new Date(event.starts_at),
      endedAt: event.ends_at ? new Date(event.ends_at) : new Date(event.starts_at),
      capacity: total,
      totalPasses: total,
      usedPasses: scanned,
      revByTier: revenueByTier.map((t) => ({
        tierName: t.tier_name,
        qty: t.quantity_sold,
        revenueCents: t.revenue_cents,
      })),
      peakEntryHour: peakHour ?? 0,
      refundedOrders: 0,
      noShows: noShowCount,
    });

    return NextResponse.json({ report, llm_summary: enriched.llm_summary ?? null });
  } catch (err) {
    console.error("[POST /api/events/[id]/debrief]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
