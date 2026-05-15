import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EventStatusBadge, type EventStatus } from "@/components/event-status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "../_components/page-header";
import { computeReadiness, getCurrentPromoter, listPromoterEvents } from "../_lib/queries";

export const metadata = { title: "Events — WeFetePass" };

const filters = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
  { key: "soldout", label: "Sold out" },
  { key: "cancelled", label: "Cancelled" },
] as const;

function mapStatus(s: string): EventStatus {
  if (s === "soldout") return "sold_out";
  if (s === "published") return "on_sale";
  if (s === "draft") return "draft";
  if (s === "cancelled") return "cancelled";
  return "scheduled";
}

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  let events = await listPromoterEvents(promoter.user.id);
  if (status && status !== "all") {
    events = events.filter((e) => e.status === status);
  }

  const eventIds = events.map((e) => e.id);
  const supabase = await createClient();
  const tierMap = new Map<string, { sold: number; cap: number }>();
  if (eventIds.length > 0) {
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("event_id, quantity, quantity_sold")
      .in("event_id", eventIds);
    for (const t of tiers ?? []) {
      const cur = tierMap.get(t.event_id) ?? { sold: 0, cap: 0 };
      cur.sold += t.quantity_sold ?? 0;
      cur.cap += t.quantity ?? 0;
      tierMap.set(t.event_id, cur);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Every fete you've created, drafts to sold out."
        actions={
          <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/dashboard/events/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              New event
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (status ?? "all") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/dashboard/events" : `/dashboard/events?status=${f.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-border/60 bg-background hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-6 w-6" aria-hidden />}
          title="No events yet"
          description="Create your first event to start selling tickets."
        >
          <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/dashboard/events/new">Create event</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sold</th>
                  <th className="px-4 py-3 text-left font-medium">Readiness</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const r = computeReadiness(e);
                  const t = tierMap.get(e.id) ?? { sold: 0, cap: 0 };
                  return (
                    <tr key={e.id} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/events/${e.id}`}
                          className="font-medium hover:underline"
                        >
                          {e.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{e.venue}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(e.starts_at)}
                      </td>
                      <td className="px-4 py-3">
                        <EventStatusBadge status={mapStatus(e.status)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{t.sold}</span>
                        <span className="text-muted-foreground"> / {t.cap}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-muted text-foreground hover:bg-muted">
                          {r.score}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 text-xs">
                          <Link
                            href={`/dashboard/events/${e.id}/edit`}
                            className="rounded px-2 py-1 hover:bg-muted"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/dashboard/events/${e.id}/analytics`}
                            className="rounded px-2 py-1 hover:bg-muted"
                          >
                            Analytics
                          </Link>
                          <Link
                            href={`/dashboard/scan?event=${e.id}`}
                            className="rounded px-2 py-1 hover:bg-muted"
                          >
                            Scanner
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
