import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

type Params = { id: string };

async function readDecision(request: Request): Promise<{ decision: string | null; notes: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { decision?: string; notes?: string };
    return { decision: body.decision ?? null, notes: body.notes ?? "" };
  }
  const form = await request.formData();
  return {
    decision: (form.get("decision") as string) ?? null,
    notes: ((form.get("notes") as string) ?? "").trim(),
  };
}

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { user } = await requireAdmin();
    const { id } = await params;
    const { decision, notes } = await readDecision(request);

    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const svc = await createServiceClient();

    const { data: existing } = await raw(svc)
      .from("bank_receipts")
      .select("id, order_id, status, amount_cents")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const row = existing as { id: string; order_id: string; status: string };
    const newStatus = decision === "approve" ? "approved" : "rejected";
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await raw(svc)
      .from("bank_receipts")
      .update({
        status: newStatus,
        review_notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: nowIso,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If approved, mark the associated order paid so passes can be issued downstream.
    if (decision === "approve" && row.order_id) {
      await raw(svc)
        .from("orders")
        .update({ status: "paid", paid_at: nowIso })
        .eq("id", row.order_id)
        .eq("status", "pending");
    }

    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/receipts", request.url), 303);
    }
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[admin/receipts/decision]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
