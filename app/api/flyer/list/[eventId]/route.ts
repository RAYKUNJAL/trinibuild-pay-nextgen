import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// `flyers` is in migration 0012 — not yet in database.types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface FlyerRow {
  id: string;
  event_id: string;
  prompt: string;
  style: string;
  aspect_ratio: string;
  copy_json: unknown;
  image_url: string | null;
  created_at: string;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership before reading flyers (RLS will also enforce this,
  // but failing fast gives a cleaner 404 path).
  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event || event.organizer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await raw(supabase)
    .from("flyers")
    .select("id, event_id, prompt, style, aspect_ratio, copy_json, image_url, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to load flyers" }, { status: 500 });
  }

  return NextResponse.json({ flyers: (data ?? []) as FlyerRow[] });
}
