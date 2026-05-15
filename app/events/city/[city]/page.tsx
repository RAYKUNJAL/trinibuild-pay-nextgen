// NOTE: The original SEO plan called for this page at /events/[city], but
// /events/[slug] already exists for the event detail page — Next.js disallows
// two different dynamic-segment names at the same level. We ship at
// /events/city/[city] instead (still strong long-tail like
// "events / city / port-of-spain") and surface internal links from /fetes/[island].

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ISLANDS } from "@/lib/islands";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/structured-data";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ city: string }>;
}

function prettyCity(raw: string): string {
  return decodeURIComponent(raw)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: raw } = await params;
  const city = prettyCity(raw);
  const title = `Fetes in ${city} — Tickets, Lineups & Carnival Events`;
  const description = `Browse upcoming fetes in ${city}. ${city} carnival events, all-inclusives, soca parties, and cooler fetes — get your digital QR ticket on WeFetePass.`;
  return {
    title,
    description,
    alternates: { canonical: `/events/city/${encodeURIComponent(raw.toLowerCase())}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function FetesByCityPage({ params }: PageProps) {
  const { city: raw } = await params;
  const city = prettyCity(raw);
  if (!city) notFound();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: eventsData } = await supabase
    .from("events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, slug, title, tagline, venue, city, starts_at, ends_at, cover_image_url, status, event_type, island, description" as any)
    .eq("status", "published")
    .ilike("city", `%${city}%`)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(48);
  const events = (eventsData as unknown as Array<{
    id: string; slug: string; title: string; tagline: string | null;
    venue: string; city: string; starts_at: string; ends_at: string | null;
    cover_image_url: string | null; status: string; event_type: string | null;
    island: string; description: string | null;
  }>) ?? [];

  if (events.length === 0) notFound();

  const islandCounts = new Map<string, number>();
  for (const e of events) islandCounts.set(e.island, (islandCounts.get(e.island) ?? 0) + 1);
  const dominantIsland = [...islandCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const island = dominantIsland ? ISLANDS.find((i) => i.code === dominantIsland) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Fetes", url: "/discover" },
          ...(island ? [{ name: island.name, url: `/fetes/${island.code}` }] : []),
          { name: city, url: `/events/city/${encodeURIComponent(raw.toLowerCase())}` },
        ])}
      />
      {events.slice(0, 24).map((e) => (
        <JsonLd
          key={e.id}
          data={eventJsonLd({
            title: e.title,
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            venue: e.venue,
            city: e.city,
            island: e.island,
            slug: e.slug,
            cover_image_url: e.cover_image_url,
            description: e.description ?? e.tagline,
          })}
        />
      ))}

      <header className="border-b border-border/60 pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Fetes in {city}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {island ? `${island.flag} ${island.name} · ` : ""}
          {events.length} upcoming fete{events.length === 1 ? "" : "s"} in {city}. Soca, all-inclusive,
          cooler and carnival events — buy your ticket and get a QR pass instantly.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard
            key={e.id}
            event={
              {
                id: e.id,
                slug: e.slug,
                title: e.title,
                tagline: e.tagline,
                venue: e.venue,
                city: e.city,
                starts_at: e.starts_at,
                cover_image_url: e.cover_image_url,
                status: e.status === "soldout" ? "sold_out" : e.status === "cancelled" ? "cancelled" : "on_sale",
              } as EventCardEvent
            }
          />
        ))}
      </section>

      <section className="mt-12 border-t border-border/60 pt-8">
        <h2 className="font-display text-xl font-bold">Explore more</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {island ? (
            <Link
              href={`/fetes/${island.code}`}
              className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-sm font-medium hover:bg-primary/20"
            >
              All fetes in {island.name}
            </Link>
          ) : null}
          <Link
            href="/blog"
            className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
          >
            Blog & guides
          </Link>
          <Link
            href="/discover"
            className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
          >
            Discover fetes
          </Link>
        </div>
      </section>
    </main>
  );
}
