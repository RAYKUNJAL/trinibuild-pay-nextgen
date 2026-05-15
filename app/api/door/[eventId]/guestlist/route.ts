import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cast helper — used for tables not yet in database.types.ts (added in migration 0006)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

interface GuestListPostBody {
  name: string;
  phone?: string | null;
  tierId?: string | null;
  notes?: string | null;
}

interface GuestEntryRow {
  id: string;
  name: string;
  phone: string | null;
  tier_id: string | null;
  notes: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    const { data: entries, error } = await raw(supabase)
      .from("guest_list_entries")
      .select("id, name, phone, tier_id, notes, checked_in, checked_in_at, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entries: (entries ?? []) as GuestEntryRow[] });
  } catch (err) {
    console.error("[GET /api/door/[eventId]/guestlist]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id")
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    const body = (await request.json()) as GuestListPostBody;
    const { name, phone, tierId, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 422 });
    }

    const service = await createServiceClient();
    const { data: entry, error } = await raw(service)
      .from("guest_list_entries")
      .insert({
        event_id: eventId,
        name: name.trim(),
        phone: phone ?? null,
        tier_id: tierId ?? null,
        notes: notes ?? null,
        added_by: user.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const e = entry as { id: string };
    return NextResponse.json({ entryId: e.id });
  } catch (err) {
    console.error("[POST /api/door/[eventId]/guestlist]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
