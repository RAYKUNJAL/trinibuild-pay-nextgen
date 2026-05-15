import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { id: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the refund request
    const { data: refundData, error: refundError } = await supabase
      .from("refund_requests")
      .select(
        "id, order_id, buyer_id, event_id, reason, reason_detail, amount_cents, approved_amount_cents, status, organizer_response, admin_note, resolved_at, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (refundError || !refundData) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    const refund = refundData as {
      id: string;
      order_id: string;
      buyer_id: string;
      event_id: string;
      reason: string;
      reason_detail: string | null;
      amount_cents: number;
      approved_amount_cents: number | null;
      status: string;
      organizer_response: string | null;
      admin_note: string | null;
      resolved_at: string | null;
      created_at: string;
      updated_at: string;
    };

    // Verify the caller is the buyer or the organizer of the event
    const isBuyer = refund.buyer_id === user.id;

    if (!isBuyer) {
      // Check if this user is the organizer
      const { data: eventData } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", refund.event_id)
        .maybeSingle();

      const isOrganizer =
        (eventData as { organizer_id: string } | null)?.organizer_id === user.id;

      if (!isOrganizer) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch timeline events
    const { data: eventsData } = await supabase
      .from("refund_events")
      .select("id, actor_id, actor_role, event_type, note, metadata, created_at")
      .eq("refund_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ refund, events: eventsData ?? [] });
  } catch (err) {
    console.error("[GET /api/refunds/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
