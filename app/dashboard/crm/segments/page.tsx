import Link from "next/link";
import { Users, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatTTD, formatDateTime } from "@/lib/utils";
import { CrmSegmentChip, type BuyerSegment } from "@/components/crm-segment-chip";
import { PageHeader } from "../../_components/page-header";
import { getCurrentPromoter, listPromoterEvents } from "../../_lib/queries";

export const metadata = { title: "Buyer Segments — WeFetePass" };

type BuyerSummary = {
  buyerId: string;
  name: string;
  phone: string | null;
  totalCents: number;
  orderCount: number;
  distinctEvents: number;
  lastOrderAt: string;
};

type SegmentedBuyers = Record<BuyerSegment, BuyerSummary[]>;

export default async function SegmentsPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const events = await listPromoterEvents(promoter.user.id);
  const eventIds = events.map((e) => e.id);

  const supabase = await createClient();

  if (eventIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Buyer Segments"
          description="Understand your crowd by purchase behaviour."
        />
        <p className="text-sm text-muted-foreground">
          No events yet — segments will appear once you have paid orders.
        </p>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, buyer_id, buyer_phone, event_id, total_cents, created_at, status")
    .in("event_id", eventIds)
    .eq("status", "paid");

  // Aggregate per buyer
  const byBuyer = new Map<
    string,
    {
      buyerId: string;
      phone: string | null;
      totalCents: number;
      orderCount: number;
      eventIds: Set<string>;
      lastOrderAt: string;
    }
  >();

  for (const o of orders ?? []) {
    const key = o.buyer_id ?? `anon:${o.buyer_phone ?? "unknown"}`;
    const cur = byBuyer.get(key);
    if (!cur) {
      byBuyer.set(key, {
        buyerId: o.buyer_id ?? key,
        phone: o.buyer_phone ?? null,
        totalCents: o.total_cents ?? 0,
        orderCount: 1,
        eventIds: new Set([o.event_id]),
        lastOrderAt: o.created_at,
      });
    } else {
      cur.totalCents += o.total_cents ?? 0;
      cur.orderCount += 1;
      cur.eventIds.add(o.event_id);
      if (new Date(o.created_at) > new Date(cur.lastOrderAt)) {
        cur.lastOrderAt = o.created_at;
      }
    }
  }

  // Fetch profiles for all buyer IDs
  const buyerIds = Array.from(byBuyer.values())
    .map((b) => b.buyerId)
    .filter((id) => !id.startsWith("anon:"));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", buyerIds.length > 0 ? buyerIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const segments: SegmentedBuyers = {
    vip: [],
    loyal: [],
    first_timer: [],
    lapsed: [],
    at_risk: [],
  };

  for (const [, b] of byBuyer) {
    const profile = profileMap.get(b.buyerId);
    const buyer: BuyerSummary = {
      buyerId: b.buyerId,
      name: profile?.full_name ?? "Unknown buyer",
      phone: profile?.phone ?? b.phone,
      totalCents: b.totalCents,
      orderCount: b.orderCount,
      distinctEvents: b.eventIds.size,
      lastOrderAt: b.lastOrderAt,
    };

    const lastOrderDate = new Date(b.lastOrderAt);
    const isLapsed = lastOrderDate < sixMonthsAgo;
    const isAtRisk = !isLapsed && lastOrderDate < threeMonthsAgo && b.orderCount === 1;
    const isVip = b.totalCents >= 200_000 || b.orderCount >= 5;
    const isLoyal = b.eventIds.size >= 3;
    const isFirstTimer = b.orderCount === 1 && !isAtRisk && !isLapsed;

    if (isVip) segments.vip.push(buyer);
    else if (isLoyal) segments.loyal.push(buyer);
    else if (isFirstTimer) segments.first_timer.push(buyer);
    else if (isLapsed) segments.lapsed.push(buyer);
    else if (isAtRisk) segments.at_risk.push(buyer);
  }

  const segmentOrder: BuyerSegment[] = ["vip", "loyal", "first_timer", "lapsed", "at_risk"];

  const segmentDescriptions: Record<BuyerSegment, string> = {
    vip: "Spent TTD 2,000+ or made 5+ purchases",
    loyal: "Attended 3 or more distinct events",
    first_timer: "Only one purchase, recent",
    lapsed: "Last purchase over 6 months ago",
    at_risk: "Bought once, 3–6 months ago",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyer Segments"
        description="Understand your crowd by purchase behaviour and target them with broadcasts."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/crm">
              <Users className="h-4 w-4 mr-1.5" aria-hidden />
              All Buyers
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {segmentOrder.map((seg) => {
          const buyers = segments[seg];
          const top10 = buyers.slice(0, 10);

          return (
            <Card key={seg} className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <CrmSegmentChip segment={seg} count={buyers.length} />
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 px-2 text-xs gap-1"
                    disabled={buyers.length === 0}
                  >
                    <Link
                      href={`/dashboard/crm/broadcasts/new?segment=${seg}`}
                      aria-label={`Send broadcast to ${seg} segment`}
                    >
                      <Send className="h-3 w-3" aria-hidden />
                      Broadcast
                    </Link>
                  </Button>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{segmentDescriptions[seg]}</p>
              </CardHeader>

              <Separator />

              <CardContent className="pt-3 pb-2">
                {top10.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No buyers in this segment yet.</p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {top10.map((buyer) => (
                      <li key={buyer.buyerId} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{buyer.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {buyer.orderCount} order{buyer.orderCount !== 1 ? "s" : ""} ·{" "}
                            {formatDateTime(buyer.lastOrderAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums">
                          {formatTTD(buyer.totalCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {buyers.length > 10 && (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    +{buyers.length - 10} more buyers
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
