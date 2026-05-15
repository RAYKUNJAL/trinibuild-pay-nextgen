import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cast helper — used for tables not yet in database.types.ts (added in migration 0006)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface BroadcastPostBody {
  eventId?: string;
  tierIds?: string[];
  body: string;
  channel: "whatsapp" | "sms" | "both";
  scheduledFor?: string;
}

interface BroadcastRow {
  id: string;
  event_id: string | null;
  channel: string;
  status: string;
  recipient_count: number | null;
  sent_count: number | null;
  failed_count: number | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  body: string;
  subject: string | null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    let query = raw(supabase)
      .from("broadcasts")
      .select(
        "id, event_id, channel, status, recipient_count, sent_count, failed_count, scheduled_for, sent_at, created_at, body, subject",
      )
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ broadcasts: (data ?? []) as BroadcastRow[] });
  } catch (err) {
    console.error("[GET /api/broadcasts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = (await request.json()) as BroadcastPostBody;
    const { eventId, tierIds, body, channel, scheduledFor } = json;

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 422 });
    }
    if (!channel) {
      return NextResponse.json({ error: "Channel is required" }, { status: 422 });
    }

    // Count distinct buyer phones for the audience scope
    let recipientCount = 0;
    if (eventId) {
      let ordersQuery = supabase
        .from("orders")
        .select("buyer_phone", { count: "exact" })
        .eq("event_id", eventId)
        .eq("status", "paid")
        .not("buyer_phone", "is", null);

      if (tierIds && tierIds.length > 0) {
        const { data: tierOrderIds } = await supabase
          .from("order_items")
          .select("order_id")
          .in("tier_id", tierIds);
        const orderIds = (tierOrderIds ?? []).map((r) => r.order_id);
        if (orderIds.length === 0) {
          recipientCount = 0;
        } else {
          ordersQuery = ordersQuery.in("id", orderIds);
          const { data: phoneRows } = await ordersQuery;
          const unique = new Set((phoneRows ?? []).map((r) => r.buyer_phone));
          recipientCount = unique.size;
        }
      } else {
        const { data: phoneRows } = await ordersQuery;
        const unique = new Set((phoneRows ?? []).map((r) => r.buyer_phone));
        recipientCount = unique.size;
      }
    }

    const service = await createServiceClient();
    const { data: broadcast, error } = await raw(service)
      .from("broadcasts")
      .insert({
        organizer_id: user.id,
        event_id: eventId ?? null,
        tier_ids: tierIds ?? [],
        body,
        channel,
        status: scheduledFor ? "scheduled" : "draft",
        recipient_count: recipientCount,
        scheduled_for: scheduledFor ?? null,
      })
      .select("id, recipient_count")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const b = broadcast as { id: string; recipient_count: number | null };

    return NextResponse.json({
      broadcastId: b.id,
      recipientCount: b.recipient_count ?? 0,
    });
  } catch (err) {
    console.error("[POST /api/broadcasts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
