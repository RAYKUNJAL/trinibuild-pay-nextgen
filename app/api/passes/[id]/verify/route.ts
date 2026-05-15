import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyPassToken } from "@/lib/pass-token";
import type { Database } from "@/lib/database.types";

type PassRow = Database["public"]["Tables"]["passes"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface VerifyBody {
  token?: string;
  code?: string;
  eventId: string;
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

    const { data: profileRaw } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const profile = profileRaw as { role: string } | null;
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: scanner role required" }, { status: 403 });
    }

    const body: VerifyBody = await request.json();
    const { token, code, eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }
    if (!token && !code) {
      return NextResponse.json({ error: "Either token or code is required" }, { status: 400 });
    }

    const service = await createServiceClient();
    let resolvedPassId = passId;

    if (token) {
      try {
        const claims = await verifyPassToken(token);
        resolvedPassId = claims.passId;

        if (claims.eventId !== eventId) {
          await service.from("scan_events").insert({
            pass_id: null,
            scanner_id: user.id,
            event_id: eventId,
            result: "wrong_event",
          });
          return NextResponse.json({ result: "wrong_event" }, { status: 200 });
        }
      } catch {
        await service.from("scan_events").insert({
          pass_id: null,
          scanner_id: user.id,
          event_id: eventId,
          result: "invalid",
        });
        return NextResponse.json({ result: "invalid" }, { status: 200 });
      }
    }

    let passQuery = service
      .from("passes")
      .select("id, event_id, status, used_at, holder_name, tier_id, code");

    if (code) {
      passQuery = passQuery.eq("code", code);
    } else {
      passQuery = passQuery.eq("id", resolvedPassId);
    }

    const { data: passRaw, error: passError } = await passQuery.single();

    if (passError || !passRaw) {
      await service.from("scan_events").insert({
        pass_id: null,
        scanner_id: user.id,
        event_id: eventId,
        result: "invalid",
      });
      return NextResponse.json({ result: "invalid" }, { status: 200 });
    }

    const pass = passRaw as Pick<PassRow, "id" | "event_id" | "status" | "used_at" | "holder_name" | "tier_id" | "code">;

    if (pass.event_id !== eventId) {
      await service.from("scan_events").insert({
        pass_id: pass.id,
        scanner_id: user.id,
        event_id: eventId,
        result: "wrong_event",
      });
      return NextResponse.json({ result: "wrong_event" }, { status: 200 });
    }

    if (pass.status === "voided") {
      await service.from("scan_events").insert({
        pass_id: pass.id,
        scanner_id: user.id,
        event_id: eventId,
        result: "invalid",
      });
      return NextResponse.json({ result: "invalid" }, { status: 200 });
    }

    if (pass.status === "used") {
      await service.from("scan_events").insert({
        pass_id: pass.id,
        scanner_id: user.id,
        event_id: eventId,
        result: "duplicate",
      });
      return NextResponse.json({ result: "duplicate", usedAt: pass.used_at }, { status: 200 });
    }

    const { data: tierRaw } = await service
      .from("ticket_tiers")
      .select("name")
      .eq("id", pass.tier_id)
      .single();
    const tier = tierRaw as { name: string } | null;

    const now = new Date().toISOString();
    await service
      .from("passes")
      .update({ status: "used", used_at: now, used_by: user.id })
      .eq("id", pass.id);

    await service.from("scan_events").insert({
      pass_id: pass.id,
      scanner_id: user.id,
      event_id: eventId,
      result: "valid",
    });

    return NextResponse.json({
      result: "valid",
      pass: {
        holderName: pass.holder_name,
        tierName: tier?.name ?? "Unknown",
        code: pass.code,
      },
    });
  } catch (err) {
    console.error("[POST /api/passes/[id]/verify]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
