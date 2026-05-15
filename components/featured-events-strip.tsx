import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import type { EventStatus } from "@/components/event-status-badge";
import { WhatsappCapture } from "@/components/whatsapp-capture";
import { ISLANDS } from "@/lib/islands";

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

export async function FeaturedEventsStrip({ island }: { island?: string }) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const islandName = island ? ISLANDS.find((i) => i.code === island)?.name : undefined;

  let query = supabase
    .from("events")
    .select(
      "id, slug, title, tagline, venue, city, starts_at, cover_image_url, status, ticket_tiers(price_cents)",
    )
    .eq("status", "published")
    .gte("starts_at", nowIso);
  if (island) query = query.eq("island", island);
  const { data } = await query
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

  // Empty-state: capture the cold visitor with a WhatsApp waitlist
  if (events.length === 0) {
    return (
      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-8 rounded-xl border border-border/60 bg-muted/20 p-8 md:grid-cols-2 md:p-12">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
                <MessageCircle className="h-3 w-3" aria-hidden />
                Be first to know
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold md:text-3xl">
                Fetes drop weekly. Get the WhatsApp.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Drop your number and we&apos;ll WhatsApp you when new fetes hit {islandName ?? "your island"} —
                Carnival, Crop Over, Sumfest, soca parties, and everything in between.
                No spam, just the line-up.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>· First access to early bird pricing</li>
                <li>· Direct from the promoter, never resold</li>
                <li>· Stop anytime by replying STOP</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border/60 bg-background p-6">
              <WhatsappCapture />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border/60 py-16 md:py-20">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {islandName ? `Coming up in ${islandName}` : "Coming up across the Caribbean"}
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
