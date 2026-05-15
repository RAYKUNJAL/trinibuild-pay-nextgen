import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { shortCode } from "@/lib/utils";
import { queuePassDelivery } from "@/lib/whatsapp";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await createServiceClient();

    // Fetch order and verify ownership
    const { data: order, error: orderError } = await service
      .from("orders")
      .select("id, buyer_id, event_id, status, buyer_phone, buyer_name")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status === "paid") {
      // Idempotent: return existing passes
      const { data: existing } = await service
        .from("passes")
        .select("id, code, holder_name, status, tier_id")
        .eq("order_id", orderId);
      return NextResponse.json({ passes: existing ?? [] });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: `Order is ${order.status} and cannot be confirmed` }, { status: 409 });
    }

    // Mark order paid
    const { error: updateError } = await service
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch order items to generate passes
    const { data: items, error: itemsError } = await service
      .from("order_items")
      .select("id, tier_id, quantity")
      .eq("order_id", orderId);

    if (itemsError || !items) {
      return NextResponse.json({ error: itemsError?.message ?? "Failed to fetch order items" }, { status: 500 });
    }

    // Generate one pass per ticket
    const passInserts = items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        order_id: orderId,
        event_id: order.event_id,
        tier_id: item.tier_id,
        holder_name: order.buyer_name ?? null,
        code: shortCode(),
        status: "valid" as const,
      })),
    );

    const { data: passes, error: passError } = await service
      .from("passes")
      .insert(passInserts)
      .select("id, code, holder_name, status, tier_id");

    if (passError || !passes) {
      return NextResponse.json({ error: passError?.message ?? "Failed to generate passes" }, { status: 500 });
    }

    // Queue WhatsApp delivery if buyer has a phone number
    if (order.buyer_phone) {
      for (const pass of passes) {
        try {
          await queuePassDelivery(pass.id, order.buyer_phone);
        } catch (waErr) {
          console.error("[confirm] WhatsApp queue failed for pass", pass.id, waErr);
        }
      }
    }

    return NextResponse.json({ passes }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/checkout/[orderId]/confirm]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
