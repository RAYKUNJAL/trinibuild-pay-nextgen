import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  RefundTimeline,
  type RefundTimelineEvent,
} from "@/components/refund-timeline";
import { formatTTD, formatDateTime } from "@/lib/utils";
import { EscalateButton } from "./_escalate-button";

export const metadata: Metadata = { title: "Refund Request — WeFetePass" };

type Params = { id: string };

type RefundStatus =
  | "pending_review"
  | "approved"
  | "processing"
  | "completed"
  | "denied"
  | "cancelled";

type Refund = {
  id: string;
  order_id: string;
  buyer_id: string;
  event_id: string;
  reason: string;
  reason_detail: string | null;
  amount_cents: number;
  approved_amount_cents: number | null;
  status: RefundStatus;
  organizer_response: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type RawTimelineEvent = {
  id: string;
  actor_role: string;
  event_type: string;
  note: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<RefundStatus, { label: string; className: string }> =
  {
    pending_review: {
      label: "Pending Review",
      className: "bg-amber-100 text-amber-900",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-900",
    },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-900" },
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

const PENDING_ESCALATION_DAYS = 5;

export default async function RefundDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch refund
  const { data: refundData } = await supabase
    .from("refund_requests")
    .select(
      "id, order_id, buyer_id, event_id, reason, reason_detail, amount_cents, approved_amount_cents, status, organizer_response, resolved_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  const refund = refundData as unknown as Refund | null;
  if (!refund || refund.buyer_id !== user.id) notFound();

  // Fetch timeline events
  const { data: eventsData } = await supabase
    .from("refund_events")
    .select("id, actor_role, event_type, note, created_at")
    .eq("refund_id", id)
    .order("created_at", { ascending: true });

  const rawEvents = (eventsData ?? []) as RawTimelineEvent[];
  const timelineEvents: RefundTimelineEvent[] = rawEvents.map((e) => ({
    id: e.id,
    actorRole: e.actor_role as RefundTimelineEvent["actorRole"],
    eventType: e.event_type as RefundTimelineEvent["eventType"],
    note: e.note,
    createdAt: e.created_at,
  }));

  // Fetch linked dispute if any
  const { data: disputeData } = await supabase
    .from("disputes")
    .select("id, status")
    .eq("refund_id", id)
    .maybeSingle();

  const dispute = disputeData as { id: string; status: string } | null;

  // Determine escalation eligibility
  const isDenied = refund.status === "denied";
  const daysPending =
    (Date.now() - new Date(refund.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const isPendingTooLong =
    refund.status === "pending_review" && daysPending > PENDING_ESCALATION_DAYS;
  const canEscalate = (isDenied || isPendingTooLong) && !dispute;

  const config = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending_review;

  return (
    <>
      <PageHeader
        title="Refund Request"
        description={`Submitted ${formatDateTime(refund.created_at)}`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Details</h2>
                <Badge className={config.className}>{config.label}</Badge>
              </div>

              <Separator />

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Requested amount</dt>
                  <dd className="font-semibold">{formatTTD(refund.amount_cents)}</dd>
                </div>
                {refund.approved_amount_cents != null ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Approved amount</dt>
                    <dd className="font-semibold text-emerald-700">
                      {formatTTD(refund.approved_amount_cents)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd>{REASON_LABELS[refund.reason] ?? refund.reason}</dd>
                </div>
                {refund.reason_detail ? (
                  <div>
                    <dt className="text-muted-foreground mb-1">Details</dt>
                    <dd className="text-sm">{refund.reason_detail}</dd>
                  </div>
                ) : null}
                {refund.organizer_response ? (
                  <div>
                    <dt className="text-muted-foreground mb-1">
                      Organiser response
                    </dt>
                    <dd className="rounded-md bg-muted/50 p-2 text-sm">
                      {refund.organizer_response}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href={`/orders/${refund.order_id}`}
                  className="text-sm text-brand-red hover:underline"
                >
                  View order
                </Link>
                {canEscalate ? (
                  <EscalateButton refundId={refund.id} />
                ) : null}
                {dispute ? (
                  <Link
                    href={`/refunds/${refund.id}/dispute`}
                    className="text-sm text-brand-red hover:underline"
                  >
                    View dispute
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold mb-4">Timeline</h2>
            <RefundTimeline events={timelineEvents} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
