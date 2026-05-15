import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  EventWebsitePreview,
  type EventWebsite,
  type Event,
  type TicketTier,
  type PromoterProfile,
} from "@/components/event-website-preview";
import { getCurrentPromoter } from "@/app/dashboard/_lib/queries";

export const metadata: Metadata = { title: "Website Preview — WeFetePass" };

export default async function EventWebsitePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();

  // Fetch event (must belong to this organizer)
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", promoter.user.id)
    .maybeSingle();

  if (!eventData) notFound();

  // Fetch website config
  const { data: websiteData } = await supabase
    .from("event_websites")
    .select("*")
    .eq("event_id", id)
    .maybeSingle();

  if (!websiteData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">No website configured yet.</p>
        <Link
          href={`/dashboard/events/${id}/website`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Builder
        </Link>
      </div>
    );
  }

  // Fetch tiers
  const { data: tiersData } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, name, description, price_cents, quantity, quantity_sold")
    .eq("event_id", id)
    .order("position", { ascending: true });

  // Fetch promoter profile
  const { data: promoterData } = await supabase
    .from("promoter_profiles")
    .select("id, brand_name, logo_url, verified, avg_trust_score")
    .eq("profile_id", promoter.user.id)
    .maybeSingle();

  const website = websiteData as EventWebsite;
  const event = eventData as Event;
  const tiers = (tiersData ?? []) as TicketTier[];
  const promoterProfile = promoterData as PromoterProfile | null;

  return (
    <div className="relative">
      {/* Back button overlay */}
      <div className="fixed left-4 top-14 z-[9998]">
        <Link
          href={`/dashboard/events/${id}/website`}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Builder
        </Link>
      </div>

      <EventWebsitePreview
        website={website}
        event={event}
        tiers={tiers}
        promoter={promoterProfile}
        isPreview
      />
    </div>
  );
}
