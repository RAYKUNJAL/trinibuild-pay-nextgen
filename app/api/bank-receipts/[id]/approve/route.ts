import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { shortCode } from "@/lib/utils";
import { queuePassDelivery } from "@/lib/whatsapp";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type PassInsert = Database["public"]["Tables"]["passes"]["Insert"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: receiptId } = await params;
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

    const service = await createServiceClient();

    // Fetch receipt with its order's event_id
    const { data: receiptRaw, error: receiptError } = await service
      .from("bank_receipts")
      .select("id, order_id, status")
      .eq("id", receiptId)
      .single();

    if (receiptError || !receiptRaw) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const receipt = receiptRaw as { id: string; order_id: string; status: string };

    // Fetch the order
    const { data: orderRaw, error: orderError } = await service
      .from("orders")
      .select("id, buyer_id, event_id, status, buyer_name, buyer_phone")
      .eq("id", receipt.order_id)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id" | "event_id" | "status" | "buyer_name" | "buyer_phone">;

    // Verify organizer owns the event
    if (profile.role !== "admin") {
      const { data: eventRaw } = await service
        .from("events")
        .select("organizer_id")
        .eq("id", order.event_id)
        .single();
      const event = eventRaw as { organizer_id: string } | null;
      if (!event || event.organizer_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
      }
    }

    if (receipt.status === "approved") {
      return NextResponse.json({ error: "Receipt already approved" }, { status: 409 });
    }
    if (receipt.status === "rejected") {
      return NextResponse.json({ error: "Receipt has been rejected and cannot be approved" }, { status: 409 });
    }

    const now = new Date().toISOString();

    await service
      .from("bank_receipts")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: now })
      .eq("id", receiptId);

    if (order.status !== "paid") {
      await service
        .from("orders")
        .update({ status: "paid", payment_provider: "bank_receipt" })
        .eq("id", order.id);

      const { data: itemsRaw } = await service
        .from("order_items")
        .select("tier_id, quantity")
        .eq("order_id", order.id);

      const items = (itemsRaw ?? []) as { tier_id: string; quantity: number }[];

      if (items.length) {
        const passInserts: PassInsert[] = items.flatMap((item) =>
          Array.from({ length: item.quantity }, () => ({
            order_id: order.id,
            event_id: order.event_id,
            tier_id: item.tier_id,
            holder_name: order.buyer_name ?? null,
            code: shortCode(),
            status: "valid" as const,
          })),
        );

        const { data: passesRaw, error: passError } = await service
          .from("passes")
          .insert(passInserts)
          .select("id");

        if (passError) {
          return NextResponse.json({ error: passError.message }, { status: 500 });
        }

        const passes = (passesRaw ?? []) as { id: string }[];

        if (order.buyer_phone) {
          for (const pass of passes) {
            try {
              await queuePassDelivery(pass.id, order.buyer_phone);
            } catch (waErr) {
              console.error("[approve] WhatsApp queue failed for pass", pass.id, waErr);
            }
          }
        }

        return NextResponse.json({ approved: true, passesGenerated: passes.length });
      }
    }

    return NextResponse.json({ approved: true, passesGenerated: 0 });
  } catch (err) {
    console.error("[POST /api/bank-receipts/[id]/approve]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
