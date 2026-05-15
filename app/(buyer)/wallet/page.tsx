import Link from "next/link";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatDateTime, cn } from "@/lib/utils";
import { ShareSeasonButton } from "./share-season";

export const metadata: Metadata = { title: "My wallet" };

type PassRow = {
  id: string;
  status: "valid" | "used" | "voided";
  used_at: string | null;
  events: {
    id: string;
    slug: string;
    title: string;
    venue: string;
    city: string;
    starts_at: string;
    cover_image_url: string | null;
  } | null;
};

type EventGroup = {
  eventId: string;
  slug: string;
  title: string;
  venue: string;
  city: string;
  starts_at: string;
  passes: PassRow[];
};

export default async function WalletPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("passes")
    .select("id, status, used_at, events:event_id(id, slug, title, venue, city, starts_at, cover_image_url)")
    .order("created_at", { ascending: false });

  const passes = ((data ?? []) as unknown as PassRow[]).filter((p) => p.events);
  const now = Date.now();

  const upcomingMap = new Map<string, EventGroup>();
  const pastMap = new Map<string, EventGroup>();
  for (const p of passes) {
    if (!p.events) continue;
    const isPast = new Date(p.events.starts_at).getTime() < now;
    const target = isPast ? pastMap : upcomingMap;
    const key = p.events.id;
    if (!target.has(key)) {
      target.set(key, {
        eventId: p.events.id,
        slug: p.events.slug,
        title: p.events.title,
        venue: p.events.venue,
        city: p.events.city,
        starts_at: p.events.starts_at,
        passes: [],
      });
    }
    target.get(key)!.passes.push(p);
  }

  const upcoming = Array.from(upcomingMap.values()).sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const past = Array.from(pastMap.values()).sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  const favoriteVenues = Array.from(new Set(upcoming.map((u) => u.venue))).slice(0, 3);

  if (error || passes.length === 0) {
    return (
      <>
        <PageHeader title="My wallet" description="Your QR tickets, all in one place." />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-display text-lg font-semibold">No tickets yet.</p>
            <p className="text-sm text-muted-foreground">Find a fete and lock in your spot.</p>
            <Button asChild className="mt-2 bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/discover">Browse fetes</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My wallet" description="Your QR tickets, all in one place." />

      <Card className="mt-6 bg-gradient-to-br from-brand-red/10 via-amber-100/40 to-background">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              My Fete Season
            </div>
            <div className="mt-1 font-display text-2xl font-bold">
              {upcoming.length} fete{upcoming.length === 1 ? "" : "s"} locked in
            </div>
            {favoriteVenues.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Favourite venues: {favoriteVenues.join(", ")}
              </p>
            ) : null}
          </div>
          <ShareSeasonButton upcomingCount={upcoming.length} venues={favoriteVenues} />
        </CardContent>
      </Card>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Upcoming fetes</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No upcoming fetes. Time to pick the next one.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcoming.map((g) => (
              <li key={g.eventId}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/events/${g.slug}`} className="font-display text-lg font-semibold hover:underline">
                          {g.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDateTime(g.starts_at)} · {g.venue}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {formatDistanceToNowStrict(new Date(g.starts_at), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {g.passes.length} pass{g.passes.length === 1 ? "" : "es"} in your wallet
                      </span>
                      <div className="flex gap-2">
                        {g.passes.slice(0, 3).map((p) => (
                          <Button key={p.id} asChild size="sm" variant="outline">
                            <Link href={`/wallet/${p.id}`}>View pass</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Past fetes</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {past.map((g) => {
              const attended = g.passes.some((p) => p.status === "used");
              return (
                <li key={g.eventId}>
                  <Card className={cn("border-border/40 opacity-80")}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <Link href={`/events/${g.slug}`} className="truncate font-medium hover:underline">
                          {g.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDateTime(g.starts_at)}</p>
                      </div>
                      {attended ? <Badge variant="secondary">Attended</Badge> : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
