import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type Params = { id: string };

type Decision = "approve" | "deny" | "partial";

interface RespondBody {
  decision: Decision;
  approvedAmountCents?: number;
  note: string;
}

export async function POST(
  request: Request,
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
      .select("id, event_id, amount_cents, status")
      .eq("id", id)
      .maybeSingle();

    if (refundError || !refundData) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    const refund = refundData as {
      id: string;
      event_id: string;
      amount_cents: number;
      status: string;
    };

    // Verify the caller is the organizer of the event
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

    const body: RespondBody = await request.json();
    const { decision, approvedAmountCents, note } = body;

    if (!decision || !note) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (decision === "partial" && !approvedAmountCents) {
      return NextResponse.json(
        { error: "approvedAmountCents is required for partial approval" },
        { status: 400 },
      );
    }

    const newStatus = decision === "deny" ? "denied" : "approved";
    const resolvedApprovedAmount =
      decision === "approve"
        ? refund.amount_cents
        : decision === "partial"
          ? (approvedAmountCents ?? null)
          : null;

    const service = await createServiceClient();

    // Update the refund request
    const { data: updatedRefund, error: updateError } = await service
      .from("refund_requests")
      .update({
        status: newStatus,
        organizer_response: note,
        approved_amount_cents: resolvedApprovedAmount,
        resolved_at: newStatus === "denied" ? new Date().toISOString() : null,
        resolved_by: newStatus === "denied" ? user.id : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert organizer_responded event
    await service.from("refund_events").insert({
      refund_id: id,
      actor_id: user.id,
      actor_role: "organizer",
      event_type: "organizer_responded",
      note,
    });

    // If approved, insert an approved event too
    if (newStatus === "approved") {
      await service.from("refund_events").insert({
        refund_id: id,
        actor_id: user.id,
        actor_role: "organizer",
        event_type: "approved",
        note:
          decision === "partial"
            ? `Partial approval: ${resolvedApprovedAmount} cents`
            : "Full refund approved",
      });
    }

    if (newStatus === "denied") {
      await service.from("refund_events").insert({
        refund_id: id,
        actor_id: user.id,
        actor_role: "organizer",
        event_type: "denied",
        note,
      });
    }

    return NextResponse.json({ refund: updatedRefund });
  } catch (err) {
    console.error("[POST /api/refunds/[id]/respond]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
