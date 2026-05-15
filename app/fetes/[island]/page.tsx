import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ISLANDS, getIslandByCode } from "@/lib/islands";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/seo/structured-data";
import { listPublishedPosts } from "@/lib/blog/queries";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ island: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { island: code } = await params;
  const island = getIslandByCode(code);
  if (!island) return { title: "Island not found" };
  const year = new Date().getFullYear();
  const title = `Fetes in ${island.name} ${year} — Tickets, Lineups & Carnival Events`;
  const description = `Browse upcoming ${island.name} fetes, all-inclusives, and carnival events. ${island.name} fete tickets, ${island.name} carnival ${year} lineup, soca parties and cooler fetes on WeFetePass.`;
  return {
    title,
    description,
    alternates: { canonical: `/fetes/${code}` },
    openGraph: { title, description, type: "website" },
  };
}

export async function generateStaticParams() {
  return ISLANDS.map((i) => ({ island: i.code }));
}

export default async function FetesByIslandPage({ params }: PageProps) {
  const { island: code } = await params;
  const island = getIslandByCode(code);
  if (!island) notFound();

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: eventsData } = await supabase
    .from("events")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, slug, title, tagline, venue, city, starts_at, ends_at, cover_image_url, status, event_type, organizer_id, island, description" as any)
    .eq("status", "published")
    .eq("island", code)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(12);
  const events = (eventsData as unknown as Array<{
    id: string; slug: string; title: string; tagline: string | null;
    venue: string; city: string; starts_at: string; ends_at: string | null;
    cover_image_url: string | null; status: string; event_type: string | null;
    organizer_id: string; island: string; description: string | null;
  }>) ?? [];

  // Top promoters by event count for this island
  const promoterCounts = new Map<string, number>();
  for (const e of events) {
    promoterCounts.set(e.organizer_id, (promoterCounts.get(e.organizer_id) ?? 0) + 1);
  }
  const topPromoterIds = [...promoterCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const { data: promotersData } = topPromoterIds.length
    ? await supabase
        .from("promoter_profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("profile_id, brand_name, logo_url" as any)
        .in("profile_id", topPromoterIds)
    : { data: [] };
  const promoters = (promotersData as unknown as Array<{ profile_id: string; brand_name: string | null; logo_url: string | null }>) ?? [];

  // Related blog posts
  const islandPosts = await listPublishedPosts({ limit: 3, island: code });

  const year = new Date().getFullYear();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Fetes", url: "/discover" },
          { name: island.name, url: `/fetes/${code}` },
        ])}
      />
      {events.map((e) => (
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

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/discover" className="hover:text-foreground">Fetes</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{island.name}</span>
      </nav>

      <header className="border-b border-border/60 pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Fetes in {island.name}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {island.flag} Browse all upcoming {island.name} fetes, all-inclusives, and carnival events.
          From soca cooler fetes to premium all-inclusive breakfasts, {island.name} carnival season
          runs {island.carnival}. Get your {island.name} fete tickets and digital QR passes on
          WeFetePass.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Upcoming {island.name} fetes</h2>
        {events.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-card p-8 text-center text-muted-foreground">
            No upcoming fetes published for {island.name} yet. Check back soon, or{" "}
            <Link href="/discover" className="underline">browse all islands</Link>.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    ends_at: e.ends_at,
                    cover_image_url: e.cover_image_url,
                    status: e.status === "soldout" ? "sold_out" : e.status === "cancelled" ? "cancelled" : "on_sale",
                    event_type: e.event_type,
                  } as unknown as EventCardEvent
                }
              />
            ))}
          </div>
        )}
      </section>

      {promoters.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Featured {island.name} promoters</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promoters.map((p) => (
              <li key={p.profile_id} className="rounded-lg border border-border/60 bg-card p-4">
                <div className="font-semibold">{p.brand_name ?? "Promoter"}</div>
                <div className="text-xs text-muted-foreground">
                  Top {island.name} fete organiser
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {islandPosts.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">From the blog</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {islandPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block rounded-lg border border-border/60 bg-card p-4 hover:border-primary/60"
                >
                  <div className="font-semibold">{p.title}</div>
                  {p.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold">Explore other islands</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ISLANDS.filter((i) => i.code !== code).map((i) => (
            <Link
              key={i.code}
              href={`/fetes/${i.code}`}
              className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
            >
              {i.flag} Fetes in {i.name}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/carnival/${year + 1}`}
            className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-sm font-medium hover:bg-primary/20"
          >
            Caribbean Carnival {year + 1}
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
          >
            Blog & guides
          </Link>
        </div>
      </section>
    </main>
  );
}
