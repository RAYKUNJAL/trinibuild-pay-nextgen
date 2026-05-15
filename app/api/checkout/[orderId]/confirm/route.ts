import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { shortCode } from "@/lib/utils";
import { queuePassDelivery } from "@/lib/whatsapp";
import type { Database } from "@/lib/database.types";

type PassInsert = Database["public"]["Tables"]["passes"]["Insert"];
type OrderRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  "id" | "buyer_id" | "event_id" | "status" | "buyer_phone" | "buyer_name"
>;
type OrderItemRow = Pick<Database["public"]["Tables"]["order_items"]["Row"], "tier_id" | "quantity">;
type PassRow = Pick<Database["public"]["Tables"]["passes"]["Row"], "id" | "code" | "holder_name" | "status" | "tier_id">;

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

    const { data: orderRaw, error: orderError } = await service
      .from("orders")
      .select("id, buyer_id, event_id, status, buyer_phone, buyer_name")
      .eq("id", orderId)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as OrderRow;

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status === "paid") {
      const { data: existingRaw } = await service
        .from("passes")
        .select("id, code, holder_name, status, tier_id")
        .eq("order_id", orderId);
      const existing = (existingRaw ?? []) as PassRow[];
      return NextResponse.json({ passes: existing });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: `Order is ${order.status} and cannot be confirmed` }, { status: 409 });
    }

    const { error: updateError } = await service
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: itemsRaw, error: itemsError } = await service
      .from("order_items")
      .select("tier_id, quantity")
      .eq("order_id", orderId);

    if (itemsError || !itemsRaw) {
      return NextResponse.json({ error: itemsError?.message ?? "Failed to fetch order items" }, { status: 500 });
    }

    const items = itemsRaw as OrderItemRow[];

    const passInserts: PassInsert[] = items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        order_id: orderId,
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
      .select("id, code, holder_name, status, tier_id");

    if (passError || !passesRaw) {
      return NextResponse.json({ error: passError?.message ?? "Failed to generate passes" }, { status: 500 });
    }

    const passes = passesRaw as PassRow[];

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
