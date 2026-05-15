import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateGoogleWalletPass } from "@/lib/google-wallet";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type PassRow = {
  id: string;
  code: string;
  holder_name: string | null;
  event_id: string;
  tier_id: string;
  order_id: string;
  events: {
    title: string;
    venue: string;
    city: string;
    starts_at: string;
    cover_image_url: string | null;
  } | null;
  ticket_tiers: { name: string } | null;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id: passId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await createServiceClient();

    const { data: rawPass, error: passError } = await service
      .from("passes")
      .select(
        "id, code, holder_name, event_id, tier_id, order_id, events:event_id(title, venue, city, starts_at, cover_image_url), ticket_tiers:tier_id(name)",
      )
      .eq("id", passId)
      .single();

    if (passError || !rawPass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    const pass = rawPass as unknown as PassRow;

    // Verify the requesting user owns this pass via the order
    const { data: orderRaw } = await service
      .from("orders")
      .select("buyer_id")
      .eq("id", pass.order_id)
      .single();

    const order = orderRaw as { buyer_id: string } | null;
    if (!order || order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!pass.events) {
      return NextResponse.json({ error: "Event data missing" }, { status: 500 });
    }

    const result = await generateGoogleWalletPass({
      passId: pass.id,
      code: pass.code,
      holderName: pass.holder_name ?? "Guest",
      eventTitle: pass.events.title,
      venue: pass.events.venue,
      city: pass.events.city,
      startsAt: new Date(pass.events.starts_at),
      tierName: pass.ticket_tiers?.name ?? "General Admission",
      heroImageUrl: pass.events.cover_image_url ?? undefined,
    });

    return NextResponse.json({
      saveUrl: result.saveUrl,
      objectId: result.objectId,
      configured: result.saveUrl !== null,
    });
  } catch (err) {
    console.error("[GET /api/passes/[id]/google-wallet]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
