import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify, shortCode } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type TierInsertBase = Omit<Database["public"]["Tables"]["ticket_tiers"]["Insert"], "event_id">;
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type TierRow = Database["public"]["Tables"]["ticket_tiers"]["Row"];

interface CreateEventBody {
  event: {
    title: string;
    tagline?: string;
    description?: string;
    venue: string;
    city: string;
    starts_at: string;
    ends_at?: string;
    cover_image_url?: string;
    gate_open_at?: string;
    event_type?: string;
    capacity?: number;
  };
  tiers: TierInsertBase[];
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

    const { data: profileRaw } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const profile = profileRaw as { role: string } | null;
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: organizer role required" }, { status: 403 });
    }

    const body: CreateEventBody = await request.json();
    const { event: eventData, tiers } = body;

    if (!eventData?.title || !eventData.venue || !eventData.city || !eventData.starts_at) {
      return NextResponse.json({ error: "Missing required event fields: title, venue, city, starts_at" }, { status: 400 });
    }
    if (!tiers?.length) {
      return NextResponse.json({ error: "At least one ticket tier is required" }, { status: 400 });
    }

    const slug = `${slugify(eventData.title)}-${shortCode().toLowerCase()}`;
    const service = await createServiceClient();

    const eventInsert: EventInsert = {
      organizer_id: user.id,
      slug,
      title: eventData.title,
      tagline: eventData.tagline ?? null,
      description: eventData.description ?? null,
      venue: eventData.venue,
      city: eventData.city,
      starts_at: eventData.starts_at,
      ends_at: eventData.ends_at ?? null,
      cover_image_url: eventData.cover_image_url ?? null,
      gate_open_at: eventData.gate_open_at ?? null,
      event_type: eventData.event_type ?? null,
      capacity: eventData.capacity ?? null,
      status: "draft",
    };

    const { data: eventRaw, error: eventError } = await service
      .from("events")
      .insert(eventInsert)
      .select()
      .single();

    if (eventError || !eventRaw) {
      return NextResponse.json({ error: eventError?.message ?? "Failed to create event" }, { status: 500 });
    }

    const event = eventRaw as EventRow;

    const tierInserts = tiers.map((tier, i) => ({
      event_id: event.id,
      name: tier.name,
      description: tier.description ?? null,
      price_cents: tier.price_cents,
      quantity: tier.quantity,
      sales_start_at: tier.sales_start_at ?? null,
      sales_end_at: tier.sales_end_at ?? null,
      position: tier.position ?? i,
    }));

    const { data: tiersRaw, error: tiersError } = await service.from("ticket_tiers").insert(tierInserts).select();

    if (tiersError) {
      await service.from("events").delete().eq("id", event.id);
      return NextResponse.json({ error: tiersError.message }, { status: 500 });
    }

    const createdTiers = (tiersRaw ?? []) as TierRow[];

    // Seed readiness checks
    const checkKeys = [
      "cover_image",
      "description",
      "at_least_one_tier",
      "payout_info_set",
      "scanner_team_added",
      "social_share_done",
      "vip_codes_generated",
      "gate_open_time_set",
    ];
    await service.from("event_readiness_checks").insert(
      checkKeys.map((key) => ({
        event_id: event.id,
        check_key: key,
        done:
          (key === "cover_image" && Boolean(eventData.cover_image_url)) ||
          (key === "description" && Boolean(eventData.description)) ||
          key === "at_least_one_tier",
      })),
    );

    return NextResponse.json({ event, tiers: createdTiers }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("events")
      .select(
        "id, slug, title, tagline, venue, city, starts_at, ends_at, cover_image_url, status, event_type, organizer_id",
        { count: "exact" },
      )
      .eq("status", "published")
      .order("starts_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (city) query = query.ilike("city", `%${city}%`);
    if (type) query = query.eq("event_type", type);

    const { data: eventsRaw, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: (eventsRaw ?? []) as Partial<EventRow>[],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
