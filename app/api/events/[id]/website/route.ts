import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EventWebsite } from "@/components/event-website-preview";

type RouteContext = { params: Promise<{ id: string }> };

// Supabase client typed helper for the event_websites table.
// The table is defined in migration 0007; database.types.ts is generated
// separately after the migration runs. We cast to `any` once here so that
// all query sites remain clean typed via explicit return casts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── shared auth + ownership check ───────────────────────────────────────────

async function authorise(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated", status: 401 as const, supabase, user: null, event: null };

  // Confirm the caller owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status, slug")
    .eq("id", eventId)
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!event)
    return { error: "Event not found or access denied", status: 404 as const, supabase, user: null, event: null };

  return { error: null, status: 200 as const, supabase, user, event };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await authorise(id);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = auth.supabase as AnyClient;
  const { data: website } = (await supabase
    .from("event_websites")
    .select("*")
    .eq("event_id", id)
    .maybeSingle()) as { data: EventWebsite | null };

  return NextResponse.json({ website: website ?? null });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await authorise(id);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = auth.supabase as AnyClient;
  const user = auth.user!;
  const body = (await req.json()) as Record<string, unknown>;

  const { data: website, error } = (await supabase
    .from("event_websites")
    .insert({
      event_id: id,
      organizer_id: user.id,
      template: (body.template as string) ?? "midnight_mas",
      headline: (body.headline as string | undefined) ?? null,
      subheadline: (body.subheadline as string | undefined) ?? null,
      description_html: (body.description_html as string | undefined) ?? null,
      gallery_image_urls: (body.gallery_image_urls as unknown[]) ?? [],
      video_url: (body.video_url as string | undefined) ?? null,
      dress_code: (body.dress_code as string | undefined) ?? null,
      lineup: (body.lineup as string[] | undefined) ?? [],
      sponsors: (body.sponsors as unknown[]) ?? [],
      faq: (body.faq as unknown[]) ?? [],
      venue_map_url: (body.venue_map_url as string | undefined) ?? null,
      venue_directions: (body.venue_directions as string | undefined) ?? null,
      contact_whatsapp: (body.contact_whatsapp as string | undefined) ?? null,
      contact_email: (body.contact_email as string | undefined) ?? null,
      meta_pixel_id: (body.meta_pixel_id as string | undefined) ?? null,
      google_analytics_id: (body.google_analytics_id as string | undefined) ?? null,
      custom_css: (body.custom_css as string | undefined) ?? null,
      custom_slug: (body.custom_slug as string | undefined) ?? null,
      status: "draft",
    })
    .select("*")
    .single()) as { data: EventWebsite | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ website }, { status: 201 });
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await authorise(id);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = auth.supabase as AnyClient;
  const event = auth.event!;
  const body = (await req.json()) as Record<string, unknown>;

  // If publishing, validate event is not cancelled
  if (body.status === "published") {
    if ((event as { status: string }).status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot publish a website for a cancelled event." },
        { status: 422 },
      );
    }
  }

  // Build the update payload — only include keys present in the body
  const allowed = [
    "template",
    "headline",
    "subheadline",
    "description_html",
    "gallery_image_urls",
    "video_url",
    "dress_code",
    "lineup",
    "sponsors",
    "faq",
    "venue_map_url",
    "venue_directions",
    "contact_whatsapp",
    "contact_email",
    "meta_pixel_id",
    "google_analytics_id",
    "custom_css",
    "custom_slug",
    "status",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (body.status === "published") {
    patch.published_at = new Date().toISOString();
  }

  const { data: website, error } = (await supabase
    .from("event_websites")
    .update(patch)
    .eq("event_id", id)
    .select("*")
    .single()) as { data: EventWebsite | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ website });
}
