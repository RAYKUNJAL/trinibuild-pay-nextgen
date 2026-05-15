import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ISLANDS, getIslandByCode } from "@/lib/islands";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/structured-data";

export const revalidate = 600;

const SUPPORTED_YEARS = [2026, 2027, 2028];

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year: yearStr } = await params;
  const year = Number.parseInt(yearStr, 10);
  if (!SUPPORTED_YEARS.includes(year)) return { title: "Carnival year not found" };
  const title = `Caribbean Carnival ${year} — Tickets, Lineup & Dates`;
  const description = `Caribbean Carnival ${year}: dates, lineups, and tickets for Trinidad Carnival ${year}, Jamaica Carnival, Crop Over, Spicemas, and every island. Find ${year} fete tickets on WeFetePass.`;
  return {
    title,
    description,
    alternates: { canonical: `/carnival/${year}` },
    openGraph: { title, description, type: "website" },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_YEARS.map((y) => ({ year: String(y) }));
}

export default async function CarnivalYearPage({ params }: PageProps) {
  const { year: yearStr } = await params;
  const year = Number.parseInt(yearStr, 10);
  if (!SUPPORTED_YEARS.includes(year)) notFound();

  const supabase = await createClient();
  const startIso = `${year}-01-01T00:00:00.000Z`;
  const endIso = `${year + 1}-01-01T00:00:00.000Z`;

  const { data: eventsData } = await supabase
    .from("events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, slug, title, tagline, venue, city, starts_at, ends_at, cover_image_url, status, event_type, island, description" as any)
    .eq("status", "published")
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .order("starts_at", { ascending: true })
    .limit(500);
  const events = (eventsData as unknown as Array<{
    id: string; slug: string; title: string; tagline: string | null;
    venue: string; city: string; starts_at: string; ends_at: string | null;
    cover_image_url: string | null; status: string; event_type: string | null;
    island: string; description: string | null;
  }>) ?? [];

  // Group by island
  const byIsland = new Map<string, typeof events>();
  for (const e of events) {
    const arr = byIsland.get(e.island) ?? [];
    arr.push(e);
    byIsland.set(e.island, arr);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Carnival", url: "/discover" },
          { name: `Carnival ${year}`, url: `/carnival/${year}` },
        ])}
      />
      {events.slice(0, 50).map((e) => (
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
          Caribbean Carnival {year} — Tickets, Lineup, Dates
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          The complete guide to Caribbean Carnival {year}. Browse every fete across every island,
          from Trinidad Carnival kick-off to Crop Over, Spicemas, Vincy Mas, and beyond. Grab your
          digital QR pass on WeFetePass and breeze through the gate.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Carnival season by island</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ISLANDS.map((i) => (
            <li key={i.code} className="rounded-lg border border-border/60 bg-card p-4">
              <Link href={`/fetes/${i.code}`} className="font-semibold hover:text-primary">
                {i.flag} {i.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Carnival season: <strong>{i.carnival}</strong>. {byIsland.get(i.code)?.length ?? 0} fete
                {(byIsland.get(i.code)?.length ?? 0) === 1 ? "" : "s"} listed for {year}.
              </p>
            </li>
          ))}
        </ul>
      </section>

      {[...byIsland.entries()].map(([islandCode, list]) => {
        const island = getIslandByCode(islandCode);
        return (
          <section key={islandCode} className="mt-12">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">
                {island?.flag} {island?.name ?? islandCode} — {year}
              </h2>
              <Link href={`/fetes/${islandCode}`} className="text-sm text-primary underline">
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, 6).map((e) => (
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
            </div>
          </section>
        );
      })}

      {events.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border/60 bg-card p-8 text-center text-muted-foreground">
          No {year} events published yet. Promoters: list your event to be featured.
        </div>
      ) : null}

      <section className="mt-12 border-t border-border/60 pt-8">
        <h2 className="font-display text-xl font-bold">Related</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUPPORTED_YEARS.filter((y) => y !== year).map((y) => (
            <Link
              key={y}
              href={`/carnival/${y}`}
              className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
            >
              Carnival {y}
            </Link>
          ))}
          <Link
            href="/blog"
            className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
          >
            Carnival guides
          </Link>
        </div>
      </section>
    </main>
  );
}
