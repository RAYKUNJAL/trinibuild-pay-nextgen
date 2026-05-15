import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  EventWebsitePreview,
  type EventWebsite,
  type Event,
  type TicketTier,
  type PromoterProfile,
} from "@/components/event-website-preview";

type Params = { slug: string };

// ─── Known top-level segments that are NOT event slugs ───────────────────────
// Add any route segments that coexist at app/[segment]/ so we don't shadow them.
const RESERVED_SEGMENTS = new Set([
  "dashboard",
  "events",
  "discover",
  "sign-in",
  "sign-up",
  "sign-out",
  "api",
  "favicon.ico",
  "_next",
]);

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPublicWebsiteData(slug: string) {
  if (RESERVED_SEGMENTS.has(slug)) return null;

  const supabase = await createClient();

  // 1. Try custom_slug match in event_websites (published only)
  const { data: byCustomSlug } = await supabase
    .from("event_websites")
    .select("*, events(*)")
    .eq("custom_slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (byCustomSlug) {
    return { website: byCustomSlug, event: (byCustomSlug as Record<string, unknown>).events };
  }

  // 2. Try events.slug match — find the event first, then its website
  const { data: eventBySlug } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .neq("status", "cancelled")
    .maybeSingle();

  if (eventBySlug) {
    const { data: website } = await supabase
      .from("event_websites")
      .select("*")
      .eq("event_id", eventBySlug.id)
      .eq("status", "published")
      .maybeSingle();

    if (website) {
      return { website, event: eventBySlug };
    }
  }

  return null;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicWebsiteData(slug);
  if (!result) return { title: "Event not found" };

  const { website, event } = result as { website: EventWebsite; event: Event };
  const title = website.headline ?? event.title;
  const description = website.subheadline ?? event.description ?? undefined;
  const image = event.cover_image_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicEventWebsitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  // Guard reserved routes
  if (RESERVED_SEGMENTS.has(slug)) notFound();

  const result = await getPublicWebsiteData(slug);
  if (!result) notFound();

  const { website, event } = result as { website: EventWebsite; event: Event };

  const supabase = await createClient();

  // Fetch tiers
  const { data: tiersData } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, name, description, price_cents, quantity, quantity_sold")
    .eq("event_id", event.id)
    .order("position", { ascending: true });

  // Fetch promoter profile
  const { data: promoterData } = await supabase
    .from("promoter_profiles")
    .select("id, brand_name, logo_url, verified, avg_trust_score")
    .eq("profile_id", event.organizer_id)
    .maybeSingle();

  const tiers = (tiersData ?? []) as TicketTier[];
  const promoter = promoterData as PromoterProfile | null;

  return (
    <EventWebsitePreview
      website={website}
      event={event}
      tiers={tiers}
      promoter={promoter}
      isPreview={false}
    />
  );
}
