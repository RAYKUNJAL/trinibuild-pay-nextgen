import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type PassRow = Database["public"]["Tables"]["passes"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CorrectNameBody {
  newName: string;
  reason?: string;
}

interface PolicyRow {
  name_corrections_allowed: boolean;
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

    const body: CorrectNameBody = await request.json();
    const { newName, reason } = body;

    if (!newName || newName.trim().length === 0) {
      return NextResponse.json({ error: "newName is required" }, { status: 400 });
    }

    const service = await createServiceClient();

    // Fetch pass
    const { data: passRaw, error: passError } = await service
      .from("passes")
      .select("id, order_id, event_id, holder_name")
      .eq("id", passId)
      .single();

    if (passError || !passRaw) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "order_id" | "event_id" | "holder_name">;

    // Verify authorization: must own pass OR be event organizer
    const { data: orderRaw } = await service
      .from("orders")
      .select("id, buyer_id")
      .eq("id", pass.order_id)
      .single();

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id"> | null;
    const isBuyer = order?.buyer_id === user.id;

    const { data: eventRaw } = await service
      .from("events")
      .select("id, organizer_id, starts_at")
      .eq("id", pass.event_id)
      .single();

    const event = eventRaw as Pick<EventRow, "id" | "organizer_id" | "starts_at"> | null;
    const isOrganizer = event?.organizer_id === user.id;

    if (!isBuyer && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check event hasn't started
    if (event && new Date(event.starts_at) < new Date()) {
      return NextResponse.json({ error: "Cannot correct name after the event has started" }, { status: 409 });
    }

    // Check policy
    const { data: policyRaw } = await service
      .from("event_transfer_policies")
      .select("name_corrections_allowed")
      .eq("event_id", pass.event_id)
      .maybeSingle();

    const policy: PolicyRow = policyRaw ?? { name_corrections_allowed: true };

    if (!policy.name_corrections_allowed) {
      return NextResponse.json({ error: "Name corrections are not allowed for this event" }, { status: 403 });
    }

    const oldName = pass.holder_name;
    const trimmedName = newName.trim();

    // Insert name correction record
    const { error: correctionError } = await service
      .from("pass_name_corrections")
      .insert({
        pass_id: passId,
        corrected_by: user.id,
        old_name: oldName,
        new_name: trimmedName,
        reason: reason ?? null,
      });

    if (correctionError) {
      return NextResponse.json({ error: "Failed to record name correction" }, { status: 500 });
    }

    // Update pass holder name
    const { error: updateError } = await service
      .from("passes")
      .update({ holder_name: trimmedName, updated_at: new Date().toISOString() })
      .eq("id", passId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update pass name" }, { status: 500 });
    }

    return NextResponse.json({ corrected: true, oldName, newName: trimmedName });
  } catch (err) {
    console.error("[POST /api/passes/[id]/correct-name]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
