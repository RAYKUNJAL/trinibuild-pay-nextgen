import Link from "next/link";
import { Calendar, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReadinessMeter } from "@/components/readiness-meter";
import { EventStatusBadge, type EventStatus } from "@/components/event-status-badge";

function mapStatus(s: string): EventStatus {
  if (s === "soldout") return "sold_out";
  if (s === "published") return "on_sale";
  if (s === "draft") return "draft";
  if (s === "cancelled") return "cancelled";
  return "scheduled";
}
import { createClient } from "@/lib/supabase/server";
import { formatTTD, formatDateTime } from "@/lib/utils";
import { PageHeader } from "./_components/page-header";
import {
  computeReadiness,
  getCurrentPromoter,
  listPromoterEvents,
} from "./_lib/queries";

export const metadata = { title: "Dashboard — WeFetePass" };

export default async function DashboardPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) {
    return null;
  }
  const events = await listPromoterEvents(promoter.user.id);

  const supabase = await createClient();
  const eventIds = events.map((e) => e.id);

  let ticketsSoldThisMonth = 0;
  let revenueCentsThisMonth = 0;
  let activeWaitlists = 0;
  let recentBuyers: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    event: string;
    spent_cents: number;
  }> = [];

  if (eventIds.length > 0) {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_cents, status, created_at, event_id, buyer_id, buyer_phone")
      .in("event_id", eventIds)
      .eq("status", "paid")
      .gte("created_at", startOfMonth.toISOString());

    if (orders) {
      revenueCentsThisMonth = orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
      const { count: passCount } = await supabase
        .from("passes")
        .select("id", { count: "exact", head: true })
        .in("event_id", eventIds)
        .gte("created_at", startOfMonth.toISOString());
      ticketsSoldThisMonth = passCount ?? 0;
    }

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, total_cents, buyer_id, buyer_phone, event_id, created_at")
      .in("event_id", eventIds)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentOrders && recentOrders.length > 0) {
      const buyerIds = Array.from(new Set(recentOrders.map((o) => o.buyer_id).filter(Boolean)));
      const { data: buyerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", buyerIds.length > 0 ? buyerIds : ["00000000-0000-0000-0000-000000000000"]);
      const profileMap = new Map((buyerProfiles ?? []).map((p) => [p.id, p]));
      const eventMap = new Map(events.map((e) => [e.id, e.title]));
      recentBuyers = recentOrders.map((o) => {
        const p = profileMap.get(o.buyer_id);
        return {
          id: o.id,
          name: p?.full_name ?? null,
          phone: p?.phone ?? o.buyer_phone ?? null,
          event: eventMap.get(o.event_id) ?? "—",
          spent_cents: o.total_cents ?? 0,
        };
      });
    }
  }

  const upcoming = events.filter(
    (e) => e.status !== "cancelled" && new Date(e.starts_at).getTime() > Date.now(),
  );
  const active = events.filter((e) => e.status === "published");
  const avgReadiness =
    active.length > 0
      ? Math.round(active.reduce((s, e) => s + computeReadiness(e).score, 0) / active.length)
      : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${promoter.brandName}`}
        description="Here's how your events are tracking."
        actions={
          <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/dashboard/events/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Create event
            </Link>
          </Button>
        }
      />

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Key metrics"
      >
        <StatCard label="Upcoming events" value={String(upcoming.length)} />
        <StatCard label="Tickets sold this month" value={String(ticketsSoldThisMonth)} />
        <StatCard
          label="Revenue this month"
          value={formatTTD(revenueCentsThisMonth)}
        />
        <StatCard label="Avg readiness" value={`${avgReadiness}%`} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Active events</h2>
          <Link href="/dashboard/events" className="text-sm text-brand-red hover:underline">
            View all
          </Link>
        </div>
        {active.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-6 w-6" aria-hidden />}
            title="Create your first fete"
            description="Set up your event page, add ticket tiers, and start selling."
          >
            <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="/dashboard/events/new">Create event</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((event) => {
              const readiness = computeReadiness(event);
              return (
                <Card key={event.id} className="border-border/60">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold leading-tight">
                          {event.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDateTime(event.starts_at)} · {event.venue}
                        </p>
                      </div>
                      <EventStatusBadge status={mapStatus(event.status)} />
                    </div>
                    <ReadinessMeter score={readiness.score} checks={readiness.checks} />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${event.slug}`}>View page</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/events/${event.id}/edit`}>Edit</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/events/${event.id}/analytics`}>Analytics</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/scan?event=${event.id}`}>Scanner</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent buyers</h2>
          <Link href="/dashboard/crm" className="text-sm text-brand-red hover:underline">
            Open CRM
          </Link>
        </div>
        {recentBuyers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            Your buyer list builds itself as soon as you start selling.
          </p>
        ) : (
          <Card className="border-border/60">
            <ul className="divide-y divide-border/60">
              {recentBuyers.map((b) => {
                const waLink = b.phone
                  ? `https://wa.me/${b.phone.replace(/\D/g, "")}`
                  : null;
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.name ?? b.phone ?? "Anonymous buyer"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.event} · {formatTTD(b.spent_cents)}
                      </p>
                    </div>
                    {waLink ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
