import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      .select("id, organizer_id, title, venue, starts_at, status")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }
    if (event.status === "published") {
      return NextResponse.json({ error: "Event is already published" }, { status: 409 });
    }
    if (event.status === "cancelled") {
      return NextResponse.json({ error: "Cannot publish a cancelled event" }, { status: 409 });
    }

    // Validate required fields
    const missing: string[] = [];
    if (!event.title) missing.push("title");
    if (!event.venue) missing.push("venue");
    if (!event.starts_at) missing.push("starts_at");

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 422 });
    }

    // Validate at least one tier
    const { count: tierCount } = await supabase
      .from("ticket_tiers")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id);

    if (!tierCount || tierCount < 1) {
      return NextResponse.json({ error: "Event must have at least one ticket tier before publishing" }, { status: 422 });
    }

    const service = await createServiceClient();
    const { data: published, error } = await service
      .from("events")
      .update({ status: "published" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark readiness check
    await service
      .from("event_readiness_checks")
      .upsert({ event_id: id, check_key: "at_least_one_tier", done: true }, { onConflict: "event_id,check_key" });

    return NextResponse.json({ event: published });
  } catch (err) {
    console.error("[POST /api/events/[id]/publish]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
