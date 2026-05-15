import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ReceiptFraudLevel } from "@/lib/database.types";

interface BankReceiptBody {
  orderId: string;
  imageUrl: string;
  bankRef?: string;
  amount: number; // in cents
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BankReceiptBody = await request.json();
    const { orderId, imageUrl, bankRef, amount } = body;

    if (!orderId || !imageUrl || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields: orderId, imageUrl, amount" }, { status: 400 });
    }

    // Verify caller owns the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, total_cents, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: not your order" }, { status: 403 });
    }
    if (order.status === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
    }
    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Order has been cancelled" }, { status: 409 });
    }

    const service = await createServiceClient();

    // Fraud pre-check
    let fraudLevel: ReceiptFraudLevel = "low";

    // Check 1: same image URL used before
    const { count: duplicateImageCount } = await service
      .from("bank_receipts")
      .select("id", { count: "exact", head: true })
      .eq("image_url", imageUrl)
      .neq("order_id", orderId);

    if (duplicateImageCount && duplicateImageCount > 0) {
      fraudLevel = "medium";
    }

    // Check 2: amount doesn't match order total
    if (amount !== order.total_cents) {
      fraudLevel = fraudLevel === "medium" ? "auto_reject" : "high";
    }

    const { data: receipt, error: receiptError } = await service
      .from("bank_receipts")
      .insert({
        order_id: orderId,
        buyer_id: user.id,
        image_url: imageUrl,
        bank_ref: bankRef ?? null,
        amount_cents: amount,
        status: fraudLevel === "auto_reject" ? "rejected" : "pending",
        fraud_level: fraudLevel,
      })
      .select("id, fraud_level, status")
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json({ error: receiptError?.message ?? "Failed to submit receipt" }, { status: 500 });
    }

    return NextResponse.json({ receiptId: receipt.id, fraudLevel: receipt.fraud_level, status: receipt.status }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bank-receipts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
