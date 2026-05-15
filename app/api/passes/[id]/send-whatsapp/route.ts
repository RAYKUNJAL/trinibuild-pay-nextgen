import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queuePassDelivery } from "@/lib/whatsapp";
import type { Database } from "@/lib/database.types";

type PassRow = Database["public"]["Tables"]["passes"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: passId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: passRaw, error: passError } = await supabase
      .from("passes")
      .select("id, order_id, status")
      .eq("id", passId)
      .single();

    if (passError || !passRaw) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "order_id" | "status">;

    // Fetch the order to verify ownership and get phone
    const { data: orderRaw, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, buyer_phone")
      .eq("id", pass.order_id)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id" | "buyer_phone">;

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: not your pass" }, { status: 403 });
    }

    if (pass.status === "voided") {
      return NextResponse.json({ error: "Cannot send a voided pass" }, { status: 409 });
    }

    if (!order.buyer_phone) {
      return NextResponse.json({ error: "No phone number on file for this order" }, { status: 422 });
    }

    await queuePassDelivery(passId, order.buyer_phone);

    return NextResponse.json({ queued: true });
  } catch (err) {
    console.error("[POST /api/passes/[id]/send-whatsapp]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
