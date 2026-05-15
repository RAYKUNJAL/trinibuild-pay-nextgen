import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { shortCode } from "@/lib/utils";

// Cast helper — used for tables not yet in database.types.ts (added in migration 0006)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

interface CompRow {
  id: string;
  holder_name: string;
  holder_phone: string | null;
  reason: string;
  issued_at: string;
  tier_id: string;
  pass_id: string | null;
  notes: string | null;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    const { data: comps, error } = await raw(supabase)
      .from("comp_tickets")
      .select("id, holder_name, holder_phone, reason, issued_at, tier_id, pass_id, notes")
      .eq("event_id", eventId)
      .order("issued_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ comps: (comps ?? []) as CompRow[] });
  } catch (err) {
    console.error("[GET /api/door/[eventId]/comps]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

interface CompsBody {
  holderName: string;
  holderPhone?: string;
  tierId: string;
  reason: "artist" | "sponsor" | "press" | "staff" | "promoter_guest" | "other";
  notes?: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    const body = (await request.json()) as CompsBody;
    const { holderName, holderPhone, tierId, reason, notes } = body;

    if (!holderName?.trim()) {
      return NextResponse.json({ error: "holderName is required" }, { status: 422 });
    }
    if (!tierId) {
      return NextResponse.json({ error: "tierId is required" }, { status: 422 });
    }
    if (!reason) {
      return NextResponse.json({ error: "reason is required" }, { status: 422 });
    }

    const service = await createServiceClient();

    // Verify tier belongs to this event
    const { data: tier } = await service
      .from("ticket_tiers")
      .select("id, event_id")
      .eq("id", tierId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (!tier) {
      return NextResponse.json({ error: "Tier not found for this event" }, { status: 404 });
    }

    // Generate a unique pass code
    let code = shortCode();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await service
        .from("passes")
        .select("id")
        .eq("event_id", eventId)
        .eq("code", code)
        .maybeSingle();
      if (!existing) break;
      code = shortCode();
    }

    // Create a comp order (passes require an order_id FK)
    const { data: compOrder, error: orderErr } = await service
      .from("orders")
      .insert({
        buyer_id: user.id,
        event_id: eventId,
        subtotal_cents: 0,
        fee_cents: 0,
        total_cents: 0,
        currency: "TTD",
        status: "paid",
        payment_provider: "mock",
        buyer_name: holderName,
        buyer_phone: holderPhone ?? null,
      })
      .select("id")
      .single();

    if (orderErr || !compOrder) {
      return NextResponse.json({ error: orderErr?.message ?? "Failed to create comp order" }, { status: 500 });
    }

    const co = compOrder as { id: string };

    // Create the pass
    const { data: pass, error: passErr } = await service
      .from("passes")
      .insert({
        order_id: co.id,
        event_id: eventId,
        tier_id: tierId,
        holder_name: holderName,
        code,
        status: "valid",
      })
      .select("id, code")
      .single();

    if (passErr || !pass) {
      return NextResponse.json({ error: passErr?.message ?? "Failed to create pass" }, { status: 500 });
    }

    const p = pass as { id: string; code: string };

    // Insert comp_ticket record
    const { error: compErr } = await raw(service).from("comp_tickets").insert({
      event_id: eventId,
      organizer_id: user.id,
      pass_id: p.id,
      holder_name: holderName,
      holder_phone: holderPhone ?? null,
      tier_id: tierId,
      reason,
      notes: notes ?? null,
      created_by: user.id,
    });

    if (compErr) {
      console.error("[comps] comp_ticket insert error:", compErr);
      // Non-fatal — pass already created
    }

    return NextResponse.json({ passId: p.id, code: p.code });
  } catch (err) {
    console.error("[POST /api/door/[eventId]/comps]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
