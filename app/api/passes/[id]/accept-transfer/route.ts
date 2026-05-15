import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { signPassToken } from "@/lib/pass-token";
import type { Database } from "@/lib/database.types";

type PassRow = Database["public"]["Tables"]["passes"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AcceptBody {
  transferToken: string;
  recipientPhone: string;
  recipientName?: string;
}

interface TransferRow {
  id: string;
  pass_id: string;
  to_phone: string;
  to_name: string | null;
  status: string;
  expires_at: string;
}

/** Normalize a phone to digits only for comparison. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // passId in params not used for lookup — we look up by transferToken
    await params;

    const body: AcceptBody = await request.json();
    const { transferToken, recipientPhone, recipientName } = body;

    if (!transferToken || !recipientPhone) {
      return NextResponse.json({ error: "transferToken and recipientPhone are required" }, { status: 400 });
    }

    const service = await createServiceClient();

    // Find transfer by token
    const { data: transferRaw, error: transferError } = await service
      .from("ticket_transfers")
      .select("id, pass_id, to_phone, to_name, status, expires_at")
      .eq("transfer_token", transferToken)
      .single();

    if (transferError || !transferRaw) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    const transfer = transferRaw as TransferRow;

    if (transfer.status !== "pending") {
      return NextResponse.json({ error: `Transfer is already ${transfer.status}` }, { status: 409 });
    }

    if (new Date(transfer.expires_at) < new Date()) {
      // Mark as expired
      await service
        .from("ticket_transfers")
        .update({ status: "expired" })
        .eq("id", transfer.id);
      return NextResponse.json({ error: "This transfer has expired" }, { status: 410 });
    }

    // Verify phone match (normalize both to digits for comparison)
    if (normalizePhone(transfer.to_phone) !== normalizePhone(recipientPhone)) {
      return NextResponse.json({ error: "Phone number does not match the intended recipient" }, { status: 403 });
    }

    // Resolve logged-in user if available
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine new holder name
    const newHolderName = recipientName ?? transfer.to_name;

    // Update pass holder name
    const { data: passRaw, error: passUpdateError } = await service
      .from("passes")
      .update({ holder_name: newHolderName, updated_at: new Date().toISOString() })
      .eq("id", transfer.pass_id)
      .select("id, event_id, code")
      .single();

    if (passUpdateError || !passRaw) {
      return NextResponse.json({ error: "Failed to update pass" }, { status: 500 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "event_id" | "code">;

    // Update transfer status
    const transferUpdate: Record<string, unknown> = {
      status: "accepted",
      accepted_at: new Date().toISOString(),
    };
    if (user) {
      transferUpdate.to_buyer_id = user.id;
    }

    await service
      .from("ticket_transfers")
      .update(transferUpdate)
      .eq("id", transfer.id);

    // Re-sign pass token (new JWT with same code — fresh expiry)
    const newQrToken = await signPassToken({
      passId: pass.id,
      eventId: pass.event_id,
      code: pass.code,
    });

    return NextResponse.json({
      accepted: true,
      passId: pass.id,
      newQrToken,
    });
  } catch (err) {
    console.error("[POST /api/passes/[id]/accept-transfer]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function POST_DECLINE(request: Request, { params }: RouteParams) {
  // Handled via a separate body action field pattern — see transfer accept page
  await params;
  await request.json();
  return NextResponse.json({ error: "Use the decline endpoint" }, { status: 400 });
}
