import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/app/dashboard/_components/page-header";
import { formatTTD, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Refunds & Disputes — WeFetePass Dashboard",
};

type RefundStatus =
  | "pending_review"
  | "approved"
  | "processing"
  | "completed"
  | "denied"
  | "cancelled";

type RefundRow = {
  id: string;
  amount_cents: number;
  status: RefundStatus;
  reason: string;
  created_at: string;
  orders: { buyer_name: string | null; buyer_phone: string | null } | null;
  events: { title: string } | null;
};

type DisputeStatus =
  | "open"
  | "organizer_responded"
  | "under_review"
  | "resolved_buyer"
  | "resolved_organizer"
  | "closed";

type DisputeRow = {
  id: string;
  refund_id: string | null;
  status: DisputeStatus;
  summary: string;
  created_at: string;
  orders: { buyer_name: string | null; buyer_phone: string | null } | null;
  events: { title: string } | null;
};

const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-900",
  },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-900" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-900" },
  completed: {
    label: "Completed",
    className: "bg-emerald-200 text-emerald-900",
  },
  denied: { label: "Denied", className: "bg-red-100 text-red-900" },
  cancelled: { label: "Cancelled", className: "bg-zinc-200 text-zinc-700" },
};

const DISPUTE_STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-amber-100 text-amber-900" },
  organizer_responded: {
    label: "You Responded",
    className: "bg-blue-100 text-blue-900",
  },
  under_review: {
    label: "Under Review",
    className: "bg-purple-100 text-purple-900",
  },
  resolved_buyer: {
    label: "Resolved — Buyer",
    className: "bg-emerald-100 text-emerald-900",
  },
  resolved_organizer: {
    label: "Resolved — You",
    className: "bg-red-100 text-red-900",
  },
  closed: { label: "Closed", className: "bg-zinc-200 text-zinc-700" },
};

const REASON_LABELS: Record<string, string> = {
  event_cancelled: "Event Cancelled",
  event_postponed: "Event Postponed",
  unable_to_attend: "Unable to Attend",
  duplicate_purchase: "Duplicate Purchase",
  technical_error: "Technical Error",
  other: "Other",
};

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default async function DisputesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/dashboard/disputes");

  // Get organizer's event IDs
  const { data: eventsData } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const eventIds = ((eventsData ?? []) as { id: string }[]).map((e) => e.id);

  let refunds: RefundRow[] = [];
  let disputes: DisputeRow[] = [];

  if (eventIds.length > 0) {
    const { data: refundData } = await supabase
      .from("refund_requests")
      .select(
        "id, amount_cents, status, reason, created_at, orders:order_id(buyer_name, buyer_phone), events:event_id(title)",
      )
      .in("event_id", eventIds)
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });

    refunds = (refundData ?? []) as unknown as RefundRow[];

    const { data: disputeData } = await supabase
      .from("disputes")
      .select(
        "id, refund_id, status, summary, created_at, orders:order_id(buyer_name, buyer_phone), events:event_id(title)",
      )
      .in("event_id", eventIds)
      .not("status", "in", '("closed","resolved_buyer","resolved_organizer")')
      .order("created_at", { ascending: true });

    disputes = (disputeData ?? []) as unknown as DisputeRow[];
  }

  return (
    <>
      <PageHeader
        title="Refunds & Disputes"
        description="Review refund requests and respond to buyer disputes."
      />

      <Tabs defaultValue="refunds" className="mt-6">
        <TabsList>
          <TabsTrigger value="refunds">
            Refund Requests
            {refunds.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {refunds.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes
            {disputes.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {disputes.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="refunds" className="mt-4">
          {refunds.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No pending refund requests. You're all caught up.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border/60">
                {refunds.map((r) => {
                  const days = daysSince(r.created_at);
                  const config =
                    REFUND_STATUS_CONFIG[r.status] ??
                    REFUND_STATUS_CONFIG.pending_review;
                  return (
                    <li
                      key={r.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {r.orders?.buyer_name ?? "Buyer"}
                          {r.orders?.buyer_phone ? (
                            <span className="ml-2 font-normal text-muted-foreground text-xs">
                              {r.orders.buyer_phone}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r.events?.title ?? "Event"} &middot;{" "}
                          {REASON_LABELS[r.reason] ?? r.reason} &middot;{" "}
                          {formatDateTime(r.created_at)}
                        </div>
                        {days >= 3 ? (
                          <div className="mt-1 text-xs font-medium text-amber-700">
                            {days} day{days !== 1 ? "s" : ""} pending
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {formatTTD(r.amount_cents)}
                          </div>
                          <Badge className={config.className}>
                            {config.label}
                          </Badge>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/disputes/${r.id}`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="disputes" className="mt-4">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No open disputes.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-border/60">
                {disputes.map((d) => {
                  const config =
                    DISPUTE_STATUS_CONFIG[d.status] ??
                    DISPUTE_STATUS_CONFIG.open;
                  return (
                    <li
                      key={d.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {d.orders?.buyer_name ?? "Buyer"}
                          {d.orders?.buyer_phone ? (
                            <span className="ml-2 font-normal text-muted-foreground text-xs">
                              {d.orders.buyer_phone}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {d.events?.title ?? "Event"} &middot;{" "}
                          {formatDateTime(d.created_at)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {d.summary}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={config.className}>
                          {config.label}
                        </Badge>
                        {d.refund_id ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/disputes/${d.refund_id}`}>
                              View
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
