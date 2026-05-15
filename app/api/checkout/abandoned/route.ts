import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface AbandonedCheckoutBody {
  sessionId: string;
  eventId: string;
  tierSelections: { tierId: string; quantity: number }[];
  buyerPhone?: string;
  buyerEmail?: string;
  buyerName?: string;
  subtotalCents: number;
  campaignId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AbandonedCheckoutBody;
    const { sessionId, eventId, tierSelections, buyerPhone, buyerEmail, buyerName, subtotalCents, campaignId } =
      body;

    if (!sessionId?.trim()) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 422 });
    }
    if (!eventId?.trim()) {
      return NextResponse.json({ error: "eventId is required" }, { status: 422 });
    }
    if (typeof subtotalCents !== "number") {
      return NextResponse.json({ error: "subtotalCents is required" }, { status: 422 });
    }

    // Try to get authenticated buyer (optional)
    let buyerId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) buyerId = user.id;
    } catch {
      // unauthenticated checkout — fine
    }

    const service = await createServiceClient();

    const { error } = await service.from("checkout_sessions").upsert(
      {
        session_id: sessionId,
        event_id: eventId,
        tier_selections: tierSelections,
        ...(buyerId ? { buyer_id: buyerId } : {}),
        ...(buyerPhone ? { buyer_phone: buyerPhone } : {}),
        ...(buyerEmail ? { buyer_email: buyerEmail } : {}),
        ...(buyerName ? { buyer_name: buyerName } : {}),
        subtotal_cents: subtotalCents,
        ...(campaignId ? { campaign_id: campaignId } : {}),
        abandoned_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );

    if (error) {
      console.error("[POST /api/checkout/abandoned] upsert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("[POST /api/checkout/abandoned]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get organizer's event IDs
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id);

    const eventIds = (events ?? []).map((e) => e.id);
    if (eventIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = supabase
      .from("checkout_sessions")
      .select(
        "id, session_id, buyer_id, event_id, tier_selections, buyer_phone, buyer_email, buyer_name, subtotal_cents, campaign_id, abandoned_at, recovery_message_sent_at, created_at, events(title)",
      )
      .in("event_id", eventId ? [eventId] : eventIds)
      .not("abandoned_at", "is", null)
      .is("recovered_at", null)
      .gte("abandoned_at", sevenDaysAgo.toISOString())
      .order("abandoned_at", { ascending: false });

    if (eventId && eventIds.includes(eventId)) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    console.error("[GET /api/checkout/abandoned]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
