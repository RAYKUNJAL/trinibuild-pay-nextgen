import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface ApplyBody {
  legalName: string;
  businessRegNumber?: string;
  idDocumentUrl?: string;
  socialProofUrls?: string[];
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

    // Verify role is organizer
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileRaw as { role: string } | null;

    if (!profile || profile.role !== "organizer") {
      return NextResponse.json(
        { error: "Only organizer accounts can apply for verification." },
        { status: 403 },
      );
    }

    let body: ApplyBody;
    try {
      body = (await request.json()) as ApplyBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { legalName, businessRegNumber, idDocumentUrl, socialProofUrls } = body;

    if (!legalName || typeof legalName !== "string" || legalName.trim().length === 0) {
      return NextResponse.json({ error: "legalName is required" }, { status: 400 });
    }

    if (socialProofUrls !== undefined && !Array.isArray(socialProofUrls)) {
      return NextResponse.json({ error: "socialProofUrls must be an array" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    // Check if there is an existing record — only allow upsert if status is 'not_applied'
    const { data: existing } = await serviceClient
      .from("promoter_verifications")
      .select("id, status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existing && existing.status !== "not_applied") {
      return NextResponse.json(
        {
          error: `A verification application already exists with status: ${existing.status}. You cannot reapply at this time.`,
          verificationId: existing.id,
          status: existing.status,
        },
        { status: 409 },
      );
    }

    const upsertPayload = {
      profile_id: user.id,
      status: "pending" as const,
      legal_name: legalName.trim(),
      business_reg_number: businessRegNumber?.trim() ?? null,
      id_document_url: idDocumentUrl?.trim() ?? null,
      social_proof_urls: (socialProofUrls ?? []).filter(
        (u) => typeof u === "string" && u.trim().length > 0,
      ),
      updated_at: new Date().toISOString(),
    };

    const { data: record, error: upsertError } = await serviceClient
      .from("promoter_verifications")
      .upsert(upsertPayload, { onConflict: "profile_id" })
      .select("id, status")
      .single();

    if (upsertError || !record) {
      console.error("[verification/apply] upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json(
      { verificationId: record.id, status: record.status },
      { status: existing ? 200 : 201 },
    );
  } catch (err) {
    console.error("[verification/apply] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
