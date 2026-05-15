import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import type { EventStatus } from "@/components/event-status-badge";

function statusToCard(status: "draft" | "published" | "soldout" | "cancelled"): EventStatus {
  switch (status) {
    case "soldout":
      return "sold_out";
    case "cancelled":
      return "cancelled";
    case "draft":
      return "draft";
    case "published":
    default:
      return "on_sale";
  }
}

export async function FeaturedEventsStrip() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, tagline, venue, city, starts_at, cover_image_url, status, ticket_tiers(price_cents)",
    )
    .eq("status", "published")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(6);

  const events: EventCardEvent[] = (data ?? []).map((e) => {
    const tiers = (e.ticket_tiers ?? []) as { price_cents: number }[];
    const priceFromCents = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price_cents)) : null;
    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      tagline: e.tagline,
      venue: e.venue,
      city: e.city,
      starts_at: e.starts_at,
      cover_image_url: e.cover_image_url,
      status: statusToCard(e.status),
      priceFromCents,
    };
  });

  if (events.length === 0) return null;

  return (
    <section className="border-b border-border/60 py-16 md:py-20">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Coming up across the Caribbean
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Real fetes on sale right now. Tap any one to see tiers and grab your QR.
            </p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-1 text-sm font-medium hover:underline sm:flex"
          >
            See all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/discover" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
            See all fetes <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
