import Link from "next/link";
import { DoorOpen, Users, Gift, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatTTD } from "@/lib/utils";
import { getCurrentPromoter, listPromoterEvents } from "../_lib/queries";
import { PageHeader } from "../_components/page-header";

export const metadata = { title: "Door Ops — WeFetePass" };

export default async function DoorOpsPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const now = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const supabase = await createClient();

  // List upcoming/active events
  const events = await listPromoterEvents(promoter.user.id);
  const upcomingEvents = events.filter(
    (e) => e.status !== "cancelled" && (e.ends_at ? e.ends_at > now : e.starts_at > now || true),
  );

  // Summary stats
  const eventIds = events.map((e) => e.id);
  let totalCheckInsToday = 0;
  let totalCompsIssued = 0;
  let totalDoorSalesCents = 0;

  if (eventIds.length > 0) {
    const { count: checkinCount } = await supabase
      .from("scan_events")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds)
      .eq("result", "valid")
      .gte("scanned_at", todayStart.toISOString());
    totalCheckInsToday = checkinCount ?? 0;

    const { count: compCount } = await supabase
      .from("comp_tickets")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", promoter.user.id);
    totalCompsIssued = compCount ?? 0;

    const { data: doorSalesRows } = await supabase
      .from("door_sales")
      .select("amount_collected_cents")
      .eq("organizer_id", promoter.user.id);
    totalDoorSalesCents = (doorSalesRows ?? []).reduce(
      (sum, r) => sum + (r.amount_collected_cents ?? 0),
      0,
    );
  }

  // Per-event scan counts
  const scanCountMap = new Map<string, number>();
  if (eventIds.length > 0) {
    for (const eid of eventIds) {
      const { count } = await supabase
        .from("scan_events")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eid)
        .eq("result", "valid");
      scanCountMap.set(eid, count ?? 0);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Door Ops"
        description="Manage gate check-ins, guest lists, comps, and door sales."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Check-ins Today
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalCheckInsToday}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comps Issued
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalCompsIssued}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Door Sales Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatTTD(totalDoorSalesCents)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Events list */}
      {upcomingEvents.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No upcoming events</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an event to access door operations.
          </p>
          <Button asChild variant="brand" className="mt-4">
            <Link href="/dashboard/events/new">Create event</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Events</h2>
          {upcomingEvents.map((e) => {
            const scanned = scanCountMap.get(e.id) ?? 0;
            return (
              <Card key={e.id} className="border-border/60">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{e.title}</p>
                      <Badge
                        variant={e.status === "published" ? "default" : "secondary"}
                        className="text-xs capitalize"
                      >
                        {e.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {e.venue} · {formatDateTime(e.starts_at)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {scanned} scanned today
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild variant="brand" size="sm">
                      <Link href={`/dashboard/door/${e.id}`}>
                        <DoorOpen className="mr-1.5 h-4 w-4" />
                        Open Door
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
