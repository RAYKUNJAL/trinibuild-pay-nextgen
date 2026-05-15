import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCampaignUrl, generateCampaignSlug } from "@/lib/utm";

interface CampaignPostBody {
  eventId?: string;
  name: string;
  campaignType: "street_team" | "influencer" | "social" | "email" | "whatsapp" | "other";
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  baseUrl: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    let query = supabase
      .from("campaign_links")
      .select(
        "id, name, campaign_type, utm_source, utm_medium, utm_campaign, utm_content, slug, base_url, full_url, click_count, conversion_count, revenue_cents, active, event_id, created_at, updated_at",
      )
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ campaigns: data ?? [] });
  } catch (err) {
    console.error("[GET /api/campaigns]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !["organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: organizer role required" }, { status: 403 });
    }

    const body = (await request.json()) as CampaignPostBody;
    const { eventId, name, campaignType, utmSource, utmMedium, utmCampaign, utmContent, baseUrl } =
      body;

    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 422 });
    if (!utmSource?.trim())
      return NextResponse.json({ error: "utmSource is required" }, { status: 422 });
    if (!utmMedium?.trim())
      return NextResponse.json({ error: "utmMedium is required" }, { status: 422 });
    if (!utmCampaign?.trim())
      return NextResponse.json({ error: "utmCampaign is required" }, { status: 422 });
    if (!baseUrl?.trim())
      return NextResponse.json({ error: "baseUrl is required" }, { status: 422 });

    // Verify event ownership if eventId provided
    if (eventId) {
      const { data: evt } = await supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("organizer_id", user.id)
        .maybeSingle();
      if (!evt) return NextResponse.json({ error: "Event not found or not owned" }, { status: 404 });
    }

    const fullUrl = buildCampaignUrl({
      baseUrl,
      eventSlug: "",
      utmParams: {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        ...(utmContent ? { content: utmContent } : {}),
      },
    });

    const slug = generateCampaignSlug(name);

    const { data: campaign, error: insertError } = await supabase
      .from("campaign_links")
      .insert({
        organizer_id: user.id,
        ...(eventId ? { event_id: eventId } : {}),
        name: name.trim(),
        campaign_type: campaignType ?? "other",
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        ...(utmContent ? { utm_content: utmContent } : {}),
        slug,
        base_url: baseUrl,
        full_url: fullUrl,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/campaigns]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
