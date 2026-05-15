import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ScanLine,
  UserCheck,
  Users,
  Gift,
  DollarSign,
  ArrowLeft,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatTTD } from "@/lib/utils";
import { getCurrentPromoter } from "../../_lib/queries";

export const metadata = { title: "Door Overview — WeFetePass" };

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDoorPage({ params }: PageProps) {
  const { eventId } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, venue, starts_at, capacity, status")
    .eq("id", eventId)
    .eq("organizer_id", promoter.user.id)
    .maybeSingle();

  if (!event) notFound();

  // Stats
  const { count: totalPasses } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .neq("status", "voided");

  const { count: scannedPasses } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "used");

  const { count: compCount } = await supabase
    .from("comp_tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: doorSalesRows } = await supabase
    .from("door_sales")
    .select("amount_collected_cents")
    .eq("event_id", eventId);
  const doorSalesTotal = (doorSalesRows ?? []).reduce(
    (sum, r) => sum + (r.amount_collected_cents ?? 0),
    0,
  );

  const { count: guestListCount } = await supabase
    .from("guest_list_entries")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { count: guestListCheckedIn } = await supabase
    .from("guest_list_entries")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("checked_in", true);

  const totalIssued = totalPasses ?? 0;
  const totalScanned = scannedPasses ?? 0;
  const capacity = event.capacity ?? null;
  const capacityPercent =
    capacity && capacity > 0 ? Math.min(100, Math.round((totalScanned / capacity) * 100)) : null;
  const issuedPercent =
    capacity && capacity > 0 ? Math.min(100, Math.round((totalIssued / capacity) * 100)) : null;

  const quickActions = [
    {
      href: `/dashboard/scan?event=${eventId}`,
      label: "Open Scanner",
      icon: ScanLine,
      variant: "brand" as const,
    },
    {
      href: `/dashboard/door/${eventId}/checkin`,
      label: "Manual Check-in",
      icon: UserCheck,
      variant: "outline" as const,
    },
    {
      href: `/dashboard/door/${eventId}/guestlist`,
      label: "Guest List",
      icon: Users,
      variant: "outline" as const,
    },
    {
      href: `/dashboard/door/${eventId}/comps`,
      label: "Issue Comp",
      icon: Gift,
      variant: "outline" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/dashboard/door">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Door Ops
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{event.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{event.venue}</p>
          </div>
          <Button asChild variant="brand">
            <Link href={`/dashboard/scan?event=${eventId}`}>
              <DoorOpen className="mr-2 h-4 w-4" />
              Open Scanner
            </Link>
          </Button>
        </div>
      </div>

      {/* Capacity gauge */}
      {capacity !== null && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black tabular-nums">{totalScanned}</p>
                <p className="text-sm text-muted-foreground">scanned in</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-muted-foreground">
                  / {capacity}
                </p>
                <p className="text-sm text-muted-foreground">capacity</p>
              </div>
            </div>
            <Progress
              value={capacityPercent ?? 0}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {capacityPercent ?? 0}% full
              {issuedPercent !== null && ` · ${totalIssued} tickets issued (${issuedPercent}%)`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Passes Scanned
            </CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {totalScanned}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {totalIssued}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Comps Issued
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{compCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Door Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatTTD(doorSalesTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Guest List
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {guestListCheckedIn ?? 0}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {guestListCount ?? 0}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.href} asChild variant={action.variant} className="gap-2">
                <Link href={action.href}>
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
