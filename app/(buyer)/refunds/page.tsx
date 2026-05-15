import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatTTD, formatDateTime } from "@/lib/utils";
import { Info } from "lucide-react";

export const metadata: Metadata = { title: "My Refund Requests — WeFetePass" };

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
  events: { title: string; starts_at: string } | null;
};

const STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-900",
  },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-900" },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-900",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-200 text-emerald-900",
  },
  denied: { label: "Denied", className: "bg-red-100 text-red-900" },
  cancelled: { label: "Cancelled", className: "bg-zinc-200 text-zinc-700" },
};

const REASON_LABELS: Record<string, string> = {
  event_cancelled: "Event Cancelled",
  event_postponed: "Event Postponed",
  unable_to_attend: "Unable to Attend",
  duplicate_purchase: "Duplicate Purchase",
  technical_error: "Technical Error",
  other: "Other",
};

export default async function RefundsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("refund_requests")
    .select(
      "id, amount_cents, status, reason, created_at, events:event_id(title, starts_at)",
    )
    .order("created_at", { ascending: false });

  const refunds = (data ?? []) as unknown as RefundRow[];

  return (
    <>
      <PageHeader
        title="My Refund Requests"
        description="Track the status of your refund requests."
      />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Refunds are typically processed within{" "}
          <strong>3–5 business days</strong>. You can escalate to a dispute if
          your request is denied.
        </p>
      </div>

      {refunds.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No refund requests yet.{" "}
            <Link href="/orders" className="underline">
              View your orders
            </Link>{" "}
            to request a refund.
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {refunds.map((r) => {
            const config = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending_review;
            return (
              <li key={r.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-display text-base font-semibold leading-tight">
                        {r.events?.title ?? "Event"}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {r.events?.starts_at
                          ? formatDateTime(r.events.starts_at)
                          : null}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Reason: {REASON_LABELS[r.reason] ?? r.reason} &middot;
                        Submitted {formatDateTime(r.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatTTD(r.amount_cents)}
                        </div>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/refunds/${r.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
