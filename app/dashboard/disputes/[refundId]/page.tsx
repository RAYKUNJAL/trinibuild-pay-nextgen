import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/app/dashboard/_components/page-header";
import {
  RefundTimeline,
  type RefundTimelineEvent,
} from "@/components/refund-timeline";
import { formatTTD, formatDateTime } from "@/lib/utils";
import { RespondActions } from "./_respond-actions";

export const metadata: Metadata = {
  title: "Review Refund — WeFetePass Dashboard",
};

type Params = { refundId: string };

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
  created_at: string;
  updated_at: string;
};

type Order = {
  id: string;
  total_cents: number;
  subtotal_cents: number;
  fee_cents: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;
  created_at: string;
};

type RawTimelineEvent = {
  id: string;
  actor_role: string;
  event_type: string;
  note: string | null;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  event_cancelled: "Event Cancelled",
  event_postponed: "Event Postponed",
  unable_to_attend: "Unable to Attend",
  duplicate_purchase: "Duplicate Purchase",
  technical_error: "Technical Error",
  other: "Other",
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

export default async function ReviewRefundPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { refundId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/disputes");

  // Fetch refund
  const { data: refundData } = await supabase
    .from("refund_requests")
    .select(
      "id, order_id, buyer_id, event_id, reason, reason_detail, amount_cents, approved_amount_cents, status, organizer_response, created_at, updated_at",
    )
    .eq("id", refundId)
    .maybeSingle();

  const refund = refundData as unknown as Refund | null;
  if (!refund) notFound();

  // Verify organizer owns the event
  const { data: eventData } = await supabase
    .from("events")
    .select("organizer_id, title")
    .eq("id", refund.event_id)
    .maybeSingle();

  const event = eventData as {
    organizer_id: string;
    title: string;
  } | null;
  if (!event || event.organizer_id !== user.id) notFound();

  // Fetch the order for buyer info
  const { data: orderData } = await supabase
    .from("orders")
    .select(
      "id, total_cents, subtotal_cents, fee_cents, buyer_name, buyer_phone, buyer_email, created_at",
    )
    .eq("id", refund.order_id)
    .maybeSingle();

  const order = orderData as unknown as Order | null;

  // Fetch timeline events
  const { data: eventsData } = await supabase
    .from("refund_events")
    .select("id, actor_role, event_type, note, created_at")
    .eq("refund_id", refundId)
    .order("created_at", { ascending: true });

  const rawEvents = (eventsData ?? []) as RawTimelineEvent[];
  const timelineEvents: RefundTimelineEvent[] = rawEvents.map((e) => ({
    id: e.id,
    actorRole: e.actor_role as RefundTimelineEvent["actorRole"],
    eventType: e.event_type as RefundTimelineEvent["eventType"],
    note: e.note,
    createdAt: e.created_at,
  }));

  const config = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending_review;
  const canRespond = refund.status === "pending_review";

  return (
    <>
      <PageHeader
        title="Review Refund Request"
        description={`${event.title} · Submitted ${formatDateTime(refund.created_at)}`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Buyer & Order Summary */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Order Summary
                </h2>
                <Badge className={config.className}>{config.label}</Badge>
              </div>

              <Separator />

              {order ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Buyer</dt>
                    <dd className="font-medium">
                      {order.buyer_name ?? "—"}
                    </dd>
                  </div>
                  {order.buyer_phone ? (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>
                        <a
                          href={`https://wa.me/${order.buyer_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-red hover:underline"
                        >
                          {order.buyer_phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {order.buyer_email ? (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{order.buyer_email}</dd>
                    </div>
                  ) : null}
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Order total</dt>
                    <dd className="font-semibold">
                      {formatTTD(order.total_cents)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Ordered</dt>
                    <dd>{formatDateTime(order.created_at)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Order details unavailable.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Refund reason */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">
                Refund Request
              </h2>
              <Separator />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Requested amount</dt>
                  <dd className="font-semibold">
                    {formatTTD(refund.amount_cents)}
                  </dd>
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
                    <dt className="text-muted-foreground mb-1">
                      Buyer's details
                    </dt>
                    <dd className="rounded-md bg-muted/50 p-3 text-sm">
                      {refund.reason_detail}
                    </dd>
                  </div>
                ) : null}
                {refund.organizer_response ? (
                  <div>
                    <dt className="text-muted-foreground mb-1">
                      Your response
                    </dt>
                    <dd className="rounded-md bg-muted/50 p-3 text-sm">
                      {refund.organizer_response}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {/* Respond actions */}
          {canRespond ? (
            <RespondActions
              refundId={refund.id}
              amountCents={refund.amount_cents}
            />
          ) : (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  This refund request has already been actioned (status:{" "}
                  <span className="font-medium text-foreground">
                    {config.label}
                  </span>
                  ).
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold mb-4">
              Timeline
            </h2>
            <RefundTimeline events={timelineEvents} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
