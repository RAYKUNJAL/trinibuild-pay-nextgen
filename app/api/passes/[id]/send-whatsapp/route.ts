import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queuePassDelivery } from "@/lib/whatsapp";

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

    // Fetch the pass and verify the caller owns the underlying order
    const { data: pass, error: passError } = await supabase
      .from("passes")
      .select("id, order_id, status, orders!inner(buyer_id, buyer_phone)")
      .eq("id", passId)
      .single();

    if (passError || !pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const order = Array.isArray(pass.orders) ? pass.orders[0] : pass.orders;
    if (!order || order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: not your pass" }, { status: 403 });
    }

    if (pass.status === "voided") {
      return NextResponse.json({ error: "Cannot send a voided pass" }, { status: 409 });
    }

    const phone = order.buyer_phone;
    if (!phone) {
      return NextResponse.json({ error: "No phone number on file for this order" }, { status: 422 });
    }

    await queuePassDelivery(passId, phone);

    return NextResponse.json({ queued: true });
  } catch (err) {
    console.error("[POST /api/passes/[id]/send-whatsapp]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
