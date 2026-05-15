import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventWebsiteBuilder } from "@/components/event-website-builder";
import type { EventWebsite } from "@/components/event-website-preview";
import { getCurrentPromoter } from "@/app/dashboard/_lib/queries";

export const metadata: Metadata = { title: "Event Website Builder — WeFetePass" };

export default async function EventWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();

  // Fetch event (must belong to this organizer)
  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, cover_image_url, organizer_id, status")
    .eq("id", id)
    .eq("organizer_id", promoter.user.id)
    .maybeSingle();

  if (!event) notFound();

  // Fetch tiers
  const { data: tiersData } = await supabase
    .from("ticket_tiers")
    .select("id, event_id, name, description, price_cents, quantity, quantity_sold")
    .eq("event_id", id)
    .order("position", { ascending: true });

  const tiers = tiersData ?? [];

  // Fetch existing website config (may not exist yet)
  const { data: websiteData } = await supabase
    .from("event_websites")
    .select("*")
    .eq("event_id", id)
    .maybeSingle();

  const initialWebsite = websiteData as EventWebsite | null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/events" className="hover:text-foreground transition-colors">
          Events
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link
          href={`/dashboard/events/${event.id}`}
          className="hover:text-foreground transition-colors max-w-[200px] truncate"
        >
          {event.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground">Website</span>
      </nav>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Event Website Builder
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Design and publish your event&apos;s public landing page.
        </p>
      </div>

      <EventWebsiteBuilder
        eventId={event.id}
        event={{
          title: event.title,
          slug: event.slug,
          cover_image_url: event.cover_image_url,
        }}
        initialWebsite={initialWebsite}
        tiers={tiers}
      />
    </div>
  );
}
