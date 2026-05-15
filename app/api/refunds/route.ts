import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type RefundReason =
  | "event_cancelled"
  | "event_postponed"
  | "unable_to_attend"
  | "duplicate_purchase"
  | "technical_error"
  | "other";

interface CreateRefundBody {
  orderId: string;
  reason: RefundReason;
  reasonDetail?: string;
  requestedAmountCents?: number;
}

const EXEMPT_REASONS: RefundReason[] = ["event_cancelled", "event_postponed"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateRefundBody = await request.json();
    const { orderId, reason, reasonDetail, requestedAmountCents } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the order and verify ownership + status
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, event_id, total_cents, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderData as {
      id: string;
      buyer_id: string;
      event_id: string;
      total_cents: number;
      status: string;
    };

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Only paid orders are eligible for refunds" },
        { status: 400 },
      );
    }

    // Check for existing refund on this order
    const { data: existing } = await supabase
      .from("refund_requests")
      .select("id, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { refundId: existing.id, status: existing.status, existing: true },
        { status: 200 },
      );
    }

    // Fetch event to check deadline
    const { data: eventData } = await supabase
      .from("events")
      .select("id, starts_at")
      .eq("id", order.event_id)
      .maybeSingle();

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventData as { id: string; starts_at: string };
    const deadline = new Date(event.starts_at);
    deadline.setTime(deadline.getTime() - 48 * 60 * 60 * 1000); // subtract 48h

    const isDeadlinePassed = new Date() > deadline;
    if (isDeadlinePassed && !EXEMPT_REASONS.includes(reason)) {
      return NextResponse.json(
        {
          error: "Refund deadline passed",
          detail:
            "Refund requests must be submitted at least 48 hours before the event. Exceptions apply for cancelled or postponed events.",
        },
        { status: 400 },
      );
    }

    const amountCents = requestedAmountCents ?? order.total_cents;

    const service = await createServiceClient();

    // Insert the refund request
    const { data: refundData, error: refundError } = await service
      .from("refund_requests")
      .insert({
        order_id: orderId,
        buyer_id: user.id,
        event_id: order.event_id,
        reason,
        reason_detail: reasonDetail ?? null,
        amount_cents: amountCents,
        status: "pending_review",
      })
      .select("id, status")
      .single();

    if (refundError || !refundData) {
      return NextResponse.json(
        { error: refundError?.message ?? "Failed to create refund request" },
        { status: 500 },
      );
    }

    const refund = refundData as { id: string; status: string };

    // Insert the initial refund event
    await service.from("refund_events").insert({
      refund_id: refund.id,
      actor_id: user.id,
      actor_role: "buyer",
      event_type: "created",
      note: reason,
    });

    return NextResponse.json(
      { refundId: refund.id, status: refund.status, deadline: deadline.toISOString() },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/refunds]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
