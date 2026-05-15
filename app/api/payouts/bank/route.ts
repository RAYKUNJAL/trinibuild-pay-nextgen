import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface BankPayoutBody {
  bankName: string;
  accountNumber: string;
  routingInfo: string;
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

    const body: BankPayoutBody = await request.json();
    const { bankName, accountNumber, routingInfo } = body;

    if (!bankName || !accountNumber || !routingInfo) {
      return NextResponse.json({ error: "bankName, accountNumber, and routingInfo are required" }, { status: 400 });
    }

    const payoutInfo = { bankName, accountNumber, routingInfo };
    const service = await createServiceClient();

    const { error } = await service
      .from("promoter_profiles")
      .upsert(
        { profile_id: user.id, payout_info: payoutInfo, social_links: {} },
        { onConflict: "profile_id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark payout_info_set readiness check for all active organizer events
    const { data: orgEventsRaw } = await service
      .from("events")
      .select("id")
      .eq("organizer_id", user.id)
      .in("status", ["draft", "published"]);

    const orgEvents = (orgEventsRaw ?? []) as Pick<EventRow, "id">[];

    for (const event of orgEvents) {
      await service.from("event_readiness_checks").upsert(
        { event_id: event.id, check_key: "payout_info_set", done: true },
        { onConflict: "event_id,check_key" },
      );
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("[POST /api/payouts/bank]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
