"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTTD, formatDateTime } from "@/lib/utils";

type RefundReason =
  | "event_cancelled"
  | "event_postponed"
  | "unable_to_attend"
  | "duplicate_purchase"
  | "technical_error"
  | "other";

const REASON_OPTIONS: { value: RefundReason; label: string }[] = [
  { value: "event_cancelled", label: "Event was cancelled" },
  { value: "event_postponed", label: "Event was postponed" },
  { value: "unable_to_attend", label: "Unable to attend" },
  { value: "duplicate_purchase", label: "Duplicate purchase" },
  { value: "technical_error", label: "Technical error during purchase" },
  { value: "other", label: "Other" },
];

type Order = {
  id: string;
  total_cents: number;
  status: string;
  event_id: string;
  events: { title: string; starts_at: string; venue: string } | null;
};

export function NewRefundForm({ order }: { order: Order }) {
  const router = useRouter();
  const [reason, setReason] = useState<RefundReason | "">("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          reasonDetail: reasonDetail.trim() || undefined,
        }),
      });

      const json = (await res.json()) as { refundId?: string; error?: string };

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/refunds/${json.refundId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        {/* Order summary */}
        <div className="mb-5 space-y-1">
          <p className="text-sm font-semibold">
            {order.events?.title ?? "Your order"}
          </p>
          {order.events?.starts_at ? (
            <p className="text-xs text-muted-foreground">
              {formatDateTime(order.events.starts_at)}
              {order.events.venue ? ` · ${order.events.venue}` : ""}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Order total:{" "}
            <span className="font-semibold text-foreground">
              {formatTTD(order.total_cents)}
            </span>
          </p>
        </div>

        <Separator className="mb-5" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for refund</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as RefundReason)}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonDetail">
              Additional details{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="reasonDetail"
              placeholder="Provide any extra context that may help process your refund faster…"
              rows={4}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              maxLength={1000}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            By submitting, the organiser will be notified and typically responds
            within 2 business days. Refunds are processed within 3–5 business
            days of approval.
          </p>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !reason}
              className="bg-brand-red text-white hover:bg-brand-red/90"
            >
              {loading ? "Submitting…" : "Submit refund request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
