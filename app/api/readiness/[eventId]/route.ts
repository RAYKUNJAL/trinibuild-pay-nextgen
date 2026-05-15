import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const ALL_CHECK_KEYS = [
  "cover_image",
  "description",
  "at_least_one_tier",
  "payout_info_set",
  "scanner_team_added",
  "social_share_done",
  "vip_codes_generated",
  "gate_open_time_set",
] as const;

type CheckKey = (typeof ALL_CHECK_KEYS)[number];

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify event ownership
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const service = await createServiceClient();

    const { data: checks } = await service
      .from("event_readiness_checks")
      .select("id, check_key, done, updated_at")
      .eq("event_id", eventId);

    // Compute score
    const checkMap = new Map((checks ?? []).map((c) => [c.check_key, c]));
    const allChecks = ALL_CHECK_KEYS.map((key) => ({
      key,
      done: checkMap.get(key)?.done ?? false,
      updated_at: checkMap.get(key)?.updated_at ?? null,
    }));

    const doneCount = allChecks.filter((c) => c.done).length;
    const score = Math.round((doneCount / ALL_CHECK_KEYS.length) * 100);

    return NextResponse.json({ checks: allChecks, score });
  } catch (err) {
    console.error("[GET /api/readiness/[eventId]]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const body: { checkKey: string; done: boolean } = await request.json();
    const { checkKey, done } = body;

    if (!checkKey || done === undefined) {
      return NextResponse.json({ error: "checkKey and done are required" }, { status: 400 });
    }
    if (!(ALL_CHECK_KEYS as readonly string[]).includes(checkKey)) {
      return NextResponse.json({ error: `Invalid checkKey. Must be one of: ${ALL_CHECK_KEYS.join(", ")}` }, { status: 400 });
    }

    const service = await createServiceClient();

    await service.from("event_readiness_checks").upsert(
      { event_id: eventId, check_key: checkKey, done },
      { onConflict: "event_id,check_key" },
    );

    // Recompute score
    const { data: checks } = await service
      .from("event_readiness_checks")
      .select("check_key, done")
      .eq("event_id", eventId);

    const checkMap = new Map((checks ?? []).map((c) => [c.check_key, c]));
    const allChecks = ALL_CHECK_KEYS.map((key) => ({
      key,
      done: checkMap.get(key)?.done ?? false,
    }));

    const doneCount = allChecks.filter((c) => c.done).length;
    const score = Math.round((doneCount / ALL_CHECK_KEYS.length) * 100);

    return NextResponse.json({ updated: true, checkKey, done, score });
  } catch (err) {
    console.error("[PUT /api/readiness/[eventId]]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
