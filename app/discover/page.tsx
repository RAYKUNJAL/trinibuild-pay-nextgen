import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EventCard, type EventCardEvent } from "@/components/event-card";
import { EmptyEvents } from "@/components/empty-events";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/components/event-status-badge";

export const metadata: Metadata = {
  title: "Find your next fete",
  description: "Browse fetes across Trinidad & Tobago. Soca, all-inclusive, cooler fetes, Carnival 2027.",
};

const PAGE_SIZE = 24;

const CITY_OPTIONS = ["All", "Port of Spain", "San Fernando", "Tobago"] as const;
const TYPE_OPTIONS = ["All", "Soca", "All-inclusive", "Cooler fete", "Club night", "Carnival"] as const;
const DATE_OPTIONS = ["Any", "This weekend", "This month", "Carnival 2027"] as const;

type SP = {
  q?: string;
  city?: string;
  type?: string;
  date?: string;
  page?: string;
};

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

function dateRange(opt?: string): { gte?: string; lte?: string } {
  if (!opt || opt === "Any") return {};
  const now = new Date();
  if (opt === "This weekend") {
    const day = now.getDay();
    const friday = new Date(now);
    friday.setDate(now.getDate() + ((5 - day + 7) % 7));
    friday.setHours(0, 0, 0, 0);
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    return { gte: friday.toISOString(), lte: monday.toISOString() };
  }
  if (opt === "This month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { gte: start.toISOString(), lte: end.toISOString() };
  }
  if (opt === "Carnival 2027") {
    return { gte: "2027-01-01T00:00:00.000Z", lte: "2027-03-15T00:00:00.000Z" };
  }
  return {};
}

function buildQS(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "All" && v !== "Any") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.city ?? "All";
  const type = sp.type ?? "All";
  const date = sp.date ?? "Any";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(
      "id, slug, title, tagline, venue, city, starts_at, cover_image_url, status, ticket_tiers(price_cents)",
      { count: "exact" },
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) query = query.ilike("title", `%${q}%`);
  if (city !== "All") query = query.eq("city", city);
  if (type !== "All") query = query.ilike("description", `%${type}%`);
  const range = dateRange(date);
  if (range.gte) query = query.gte("starts_at", range.gte);
  if (range.lte) query = query.lte("starts_at", range.lte);

  const { data, count } = await query;

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

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
  const hasResults = events.length > 0;

  const baseParams = { q, city, type, date };

  return (
    <Section>
      <PageHeader
        title="Find your next fete"
        description="Browse fetes across Trinidad & Tobago. Pay by bank transfer, get your QR ticket, breeze through the door."
      />

      <form className="mt-6 flex flex-col gap-4" action="/discover" method="get">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search fetes, venues, vibes"
            className="sm:max-w-md"
          />
          <Button type="submit" className="bg-brand-red text-white hover:bg-brand-red/90">
            Search
          </Button>
        </div>

        <input type="hidden" name="city" value={city} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="date" value={date} />

        <div className="space-y-3">
          <FilterRow label="City" options={CITY_OPTIONS as readonly string[]} active={city} param="city" base={baseParams} />
          <FilterRow label="Type" options={TYPE_OPTIONS as readonly string[]} active={type} param="type" base={baseParams} />
          <FilterRow label="When" options={DATE_OPTIONS as readonly string[]} active={date} param="date" base={baseParams} />
        </div>
      </form>

      <div className="mt-8">
        {hasResults ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyEvents />
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const qs = buildQS({ ...baseParams, page: p === 1 ? undefined : String(p) });
            return (
              <Link
                key={p}
                href={`/discover${qs}`}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm",
                  p === page ? "bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </Section>
  );
}

function FilterRow({
  label,
  options,
  active,
  param,
  base,
}: {
  label: string;
  options: readonly string[];
  active: string;
  param: "city" | "type" | "date";
  base: { q: string; city: string; type: string; date: string };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {options.map((o) => {
        const next = { ...base, [param]: o };
        const qs = buildQS(next);
        const isActive = active === o;
        return (
          <Link
            key={o}
            href={`/discover${qs}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {o}
          </Link>
        );
      })}
    </div>
  );
}
