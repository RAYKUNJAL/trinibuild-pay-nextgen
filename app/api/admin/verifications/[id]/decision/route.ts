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

    if (decision !== "approve" && decision !== "deny") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }
    if (decision === "deny" && !notes) {
      return NextResponse.json({ error: "Notes required for denial" }, { status: 400 });
    }

    const svc = await createServiceClient();

    const { data: existing } = await raw(svc)
      .from("promoter_verifications")
      .select("id, profile_id, status")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    const row = existing as { id: string; profile_id: string; status: string };
    const newStatus = decision === "approve" ? "approved" : "denied";
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await raw(svc)
      .from("promoter_verifications")
      .update({
        status: newStatus,
        review_notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // On approve, flip the promoter_profiles.verified flag if a row exists.
    if (decision === "approve") {
      await raw(svc)
        .from("promoter_profiles")
        .update({ verified: true, updated_at: nowIso })
        .eq("profile_id", row.profile_id);
    }

    // For HTML form submits, redirect back to the queue.
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/verifications", request.url), 303);
    }
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[admin/verifications/decision]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
