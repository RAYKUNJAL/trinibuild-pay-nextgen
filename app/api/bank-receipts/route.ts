import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database, ReceiptFraudLevel } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ReceiptInsert = Database["public"]["Tables"]["bank_receipts"]["Insert"];

interface BankReceiptBody {
  orderId: string;
  imageUrl: string;
  bankRef?: string;
  amount: number; // cents
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

    const { data: orderRaw, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, total_cents, status")
      .eq("id", orderId)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id" | "total_cents" | "status">;

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

    const { count: duplicateImageCount } = await service
      .from("bank_receipts")
      .select("id", { count: "exact", head: true })
      .eq("image_url", imageUrl)
      .neq("order_id", orderId);

    if (duplicateImageCount && duplicateImageCount > 0) {
      fraudLevel = "medium";
    }

    if (amount !== order.total_cents) {
      fraudLevel = fraudLevel === "medium" ? "auto_reject" : "high";
    }

    const receiptInsert: ReceiptInsert = {
      order_id: orderId,
      buyer_id: user.id,
      image_url: imageUrl,
      bank_ref: bankRef ?? null,
      amount_cents: amount,
      status: fraudLevel === "auto_reject" ? "rejected" : "pending",
      fraud_level: fraudLevel,
    };

    const { data: receiptRaw, error: receiptError } = await service
      .from("bank_receipts")
      .insert(receiptInsert)
      .select("id, fraud_level, status")
      .single();

    if (receiptError || !receiptRaw) {
      return NextResponse.json({ error: receiptError?.message ?? "Failed to submit receipt" }, { status: 500 });
    }

    const receipt = receiptRaw as { id: string; fraud_level: ReceiptFraudLevel; status: string };

    return NextResponse.json(
      { receiptId: receipt.id, fraudLevel: receipt.fraud_level, status: receipt.status },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/bank-receipts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
