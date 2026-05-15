import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type Params = { id: string };

const PENDING_ESCALATION_DAYS = 5;

export async function POST(
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
        "id, order_id, buyer_id, event_id, reason, reason_detail, status, created_at",
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
      status: string;
      created_at: string;
    };

    // Must be the buyer
    if (refund.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check eligibility: denied OR pending > 5 days
    const isDenied = refund.status === "denied";
    const createdAt = new Date(refund.created_at);
    const daysPending =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const isPendingTooLong =
      refund.status === "pending_review" && daysPending > PENDING_ESCALATION_DAYS;

    if (!isDenied && !isPendingTooLong) {
      return NextResponse.json(
        {
          error: "Not eligible for escalation",
          detail:
            "You can escalate if your request was denied or has been pending for more than 5 days.",
        },
        { status: 400 },
      );
    }

    const service = await createServiceClient();

    // Create the dispute
    const summary = refund.reason_detail ?? refund.reason;
    const { data: disputeData, error: disputeError } = await service
      .from("disputes")
      .insert({
        refund_id: id,
        order_id: refund.order_id,
        buyer_id: user.id,
        event_id: refund.event_id,
        summary,
        status: "open",
      })
      .select("id")
      .single();

    if (disputeError || !disputeData) {
      return NextResponse.json(
        { error: disputeError?.message ?? "Failed to create dispute" },
        { status: 500 },
      );
    }

    const dispute = disputeData as { id: string };

    // Re-open the refund for admin review
    await service
      .from("refund_requests")
      .update({ status: "pending_review" })
      .eq("id", id);

    // Insert escalated event
    await service.from("refund_events").insert({
      refund_id: id,
      actor_id: user.id,
      actor_role: "buyer",
      event_type: "escalated",
      note: "Buyer escalated to dispute",
      metadata: { dispute_id: dispute.id },
    });

    return NextResponse.json({ disputeId: dispute.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/refunds/[id]/escalate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
