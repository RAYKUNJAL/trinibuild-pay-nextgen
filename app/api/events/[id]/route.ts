import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from("events").select("*, ticket_tiers(*)");
    if (isUuid) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", id);
    }

    const { data: eventRaw, error } = await query.single();

    if (error || !eventRaw) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: eventRaw as EventRow & { ticket_tiers: unknown[] } });
  } catch (err) {
    console.error("[GET /api/events/[id]]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingRaw } = await supabase.from("events").select("id, organizer_id").eq("id", id).single();
    const existing = existingRaw as { id: string; organizer_id: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const updates = await request.json();
    const { id: _id, organizer_id: _org, created_at: _ca, ...safeUpdates } = updates;

    const service = await createServiceClient();
    const { data: eventRaw, error } = await service
      .from("events")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: eventRaw as EventRow });
  } catch (err) {
    console.error("[PUT /api/events/[id]]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingRaw } = await supabase.from("events").select("id, organizer_id").eq("id", id).single();
    const existing = existingRaw as { id: string; organizer_id: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.organizer_id !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: not your event" }, { status: 403 });
    }

    const service = await createServiceClient();
    const { error } = await service.from("events").update({ status: "cancelled" }).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    console.error("[DELETE /api/events/[id]]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
