import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { shortCode } from "@/lib/utils";
import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

type PassRow = Database["public"]["Tables"]["passes"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface TransferBody {
  toPhone: string;
  toName?: string;
  message?: string;
}

interface PolicyRow {
  transfers_allowed: boolean;
  max_transfers_per_pass: number;
  transfers_close_hours_before: number;
}

interface TransferCountRow {
  pass_id: string;
  transfer_count: number;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: passId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TransferBody = await request.json();
    const { toPhone, toName, message } = body;

    if (!toPhone) {
      return NextResponse.json({ error: "toPhone is required" }, { status: 400 });
    }

    const service = await createServiceClient();

    // Fetch pass and verify ownership via order
    const { data: passRaw, error: passError } = await service
      .from("passes")
      .select("id, order_id, event_id, status, code, holder_name")
      .eq("id", passId)
      .single();

    if (passError || !passRaw) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "order_id" | "event_id" | "status" | "code" | "holder_name">;

    // Verify ownership
    const { data: orderRaw, error: orderError } = await service
      .from("orders")
      .select("id, buyer_id")
      .eq("id", pass.order_id)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id">;
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: not your pass" }, { status: 403 });
    }

    if (pass.status !== "valid") {
      return NextResponse.json({ error: "Pass is not valid for transfer" }, { status: 409 });
    }

    // Check for existing pending transfer
    const { data: existingTransfer } = await service
      .from("ticket_transfers")
      .select("id, status")
      .eq("pass_id", passId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingTransfer) {
      return NextResponse.json({ error: "A pending transfer already exists for this pass" }, { status: 409 });
    }

    // Fetch event
    const { data: eventRaw, error: eventError } = await service
      .from("events")
      .select("id, starts_at, gate_open_at")
      .eq("id", pass.event_id)
      .single();

    if (eventError || !eventRaw) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventRaw as Pick<EventRow, "id" | "starts_at" | "gate_open_at">;

    // Fetch transfer policy (may not exist — use defaults)
    const { data: policyRaw } = await service
      .from("event_transfer_policies")
      .select("transfers_allowed, max_transfers_per_pass, transfers_close_hours_before")
      .eq("event_id", pass.event_id)
      .maybeSingle();

    const policy: PolicyRow = policyRaw ?? {
      transfers_allowed: true,
      max_transfers_per_pass: 2,
      transfers_close_hours_before: 2,
    };

    if (!policy.transfers_allowed) {
      return NextResponse.json({ error: "Transfers are not allowed for this event" }, { status: 403 });
    }

    // Check transfer count
    const { data: countRaw } = await service
      .from("pass_transfer_counts")
      .select("pass_id, transfer_count")
      .eq("pass_id", passId)
      .maybeSingle();

    const countRow = countRaw as TransferCountRow | null;
    const currentCount = countRow ? Number(countRow.transfer_count) : 0;

    if (currentCount >= policy.max_transfers_per_pass) {
      return NextResponse.json(
        { error: `Transfer limit reached. This ticket can only be transferred ${policy.max_transfers_per_pass} time(s).` },
        { status: 409 },
      );
    }

    // Check transfer window
    const now = Date.now();
    const gateOrStart = event.gate_open_at ?? event.starts_at;
    const closeMs = new Date(gateOrStart).getTime() - policy.transfers_close_hours_before * 60 * 60 * 1000;

    if (now >= closeMs) {
      return NextResponse.json(
        { error: "Transfer window has closed. Transfers are not allowed this close to gate open." },
        { status: 409 },
      );
    }

    // Calculate expiry: min(now + 48h, gate_open_at - 2h)
    const fortyEightHoursMs = now + 48 * 60 * 60 * 1000;
    const gateClose = new Date(gateOrStart).getTime() - 2 * 60 * 60 * 1000;
    const expiresAt = new Date(Math.min(fortyEightHoursMs, gateClose)).toISOString();

    // Generate transfer token
    const transferToken = shortCode() + shortCode();

    // Insert transfer record
    const { data: transferRaw, error: insertError } = await service
      .from("ticket_transfers")
      .insert({
        pass_id: passId,
        from_buyer_id: user.id,
        to_phone: toPhone,
        to_name: toName ?? null,
        event_id: pass.event_id,
        transfer_token: transferToken,
        message: message ?? null,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !transferRaw) {
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
    }

    const transfer = transferRaw as { id: string };
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;
    const acceptUrl = `${siteUrl}/wallet/${passId}/transfer/accept?token=${transferToken}`;

    return NextResponse.json({
      transferId: transfer.id,
      transferToken,
      expiresAt,
      acceptUrl,
    });
  } catch (err) {
    console.error("[POST /api/passes/[id]/transfer]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: passId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await createServiceClient();

    // Verify ownership via pass → order
    const { data: passRaw } = await service
      .from("passes")
      .select("id, order_id")
      .eq("id", passId)
      .single();

    if (!passRaw) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "order_id">;

    const { data: orderRaw } = await service
      .from("orders")
      .select("id, buyer_id")
      .eq("id", pass.order_id)
      .single();

    if (!orderRaw || (orderRaw as Pick<OrderRow, "id" | "buyer_id">).buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await service
      .from("ticket_transfers")
      .update({ status: "cancelled" })
      .eq("pass_id", passId)
      .eq("status", "pending")
      .eq("from_buyer_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to cancel transfer" }, { status: 500 });
    }

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    console.error("[DELETE /api/passes/[id]/transfer]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
