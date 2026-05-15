import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPromoter } from "../../../_lib/queries";
import { DoorCheckinCard } from "@/components/door-checkin-card";

export const metadata = { title: "Manual Check-in — WeFetePass" };

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ManualCheckinPage({ params }: PageProps) {
  const { eventId } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, venue, capacity")
    .eq("id", eventId)
    .eq("organizer_id", promoter.user.id)
    .maybeSingle();

  if (!event) notFound();

  const { count: totalPasses } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .neq("status", "voided");

  const { count: usedPasses } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "used");

  const total = totalPasses ?? 0;
  const used = usedPasses ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/dashboard/door/${eventId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Door
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Manual Check-in</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{event.title} · {event.venue}</p>
          </div>
          {/* Big gate count */}
          <div className="hidden text-right sm:block">
            <p className="text-4xl font-black tabular-nums leading-none">
              {used}
              <span className="ml-1 text-xl font-normal text-muted-foreground">/ {total}</span>
            </p>
            <p className="text-xs text-muted-foreground">entered / issued</p>
          </div>
        </div>
      </div>

      {/* Mobile gate count */}
      <div className="sm:hidden">
        <div className="rounded-xl bg-muted/40 p-4 text-center">
          <p className="text-5xl font-black tabular-nums">
            {used}
            <span className="ml-2 text-2xl font-normal text-muted-foreground">/ {total}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">entered / issued</p>
        </div>
      </div>

      {/* Check-in widget */}
      <DoorCheckinCard eventId={eventId} />
    </div>
  );
}
