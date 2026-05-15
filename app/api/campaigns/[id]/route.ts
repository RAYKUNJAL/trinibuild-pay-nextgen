import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCampaignUrl } from "@/lib/utm";

interface CampaignPutBody {
  name?: string;
  active?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: campaign, error } = await supabase
      .from("campaign_links")
      .select("*")
      .eq("id", id)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const { data: clicks } = await supabase
      .from("campaign_clicks")
      .select("id, visitor_id, converted, order_id, created_at")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({ campaign, clicks: clicks ?? [] });
  } catch (err) {
    console.error("[GET /api/campaigns/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: existing } = await supabase
      .from("campaign_links")
      .select("id, base_url, utm_source, utm_medium, utm_campaign, utm_content")
      .eq("id", id)
      .eq("organizer_id", user.id)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = (await request.json()) as CampaignPutBody;
    const { name, active, utmSource, utmMedium, utmCampaign, utmContent } = body;

    const updates: Record<string, string | boolean | null> = {};
    if (name !== undefined) updates.name = name.trim();
    if (active !== undefined) updates.active = active;

    const newSource = utmSource ?? existing.utm_source;
    const newMedium = utmMedium ?? existing.utm_medium;
    const newCampaign = utmCampaign ?? existing.utm_campaign;
    const newContent = utmContent !== undefined ? utmContent : existing.utm_content;

    const utmChanged =
      utmSource !== undefined || utmMedium !== undefined || utmCampaign !== undefined || utmContent !== undefined;

    if (utmChanged) {
      updates.utm_source = newSource;
      updates.utm_medium = newMedium;
      updates.utm_campaign = newCampaign;
      updates.utm_content = newContent ?? null;
      updates.full_url = buildCampaignUrl({
        baseUrl: existing.base_url,
        eventSlug: "",
        utmParams: {
          source: newSource,
          medium: newMedium,
          campaign: newCampaign,
          ...(newContent ? { content: newContent } : {}),
        },
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 422 });
    }

    const { data: campaign, error } = await supabase
      .from("campaign_links")
      .update(updates)
      .eq("id", id)
      .eq("organizer_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[PUT /api/campaigns/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: campaign, error } = await supabase
      .from("campaign_links")
      .update({ active: false })
      .eq("id", id)
      .eq("organizer_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error("[DELETE /api/campaigns/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
