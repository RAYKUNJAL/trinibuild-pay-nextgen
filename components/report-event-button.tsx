"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportReason =
  | "fake_event"
  | "event_cancelled_no_notice"
  | "no_refund"
  | "misleading_description"
  | "fraud"
  | "other";

const REASON_LABELS: Record<ReportReason, string> = {
  fake_event: "Fake or non-existent event",
  event_cancelled_no_notice: "Event cancelled without notice",
  no_refund: "Refund requested but not received",
  misleading_description: "Misleading event description",
  fraud: "Fraud or financial abuse",
  other: "Other",
};

type State =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

export function ReportEventButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset form on close, but preserve success message briefly
      setTimeout(() => {
        setState({ phase: "idle" });
        setReason("");
        setDetail("");
        setReporterEmail("");
      }, 300);
    }
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reason) return;

    setState({ phase: "submitting" });

    try {
      const res = await fetch(`/api/events/${eventId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          detail: detail.trim() || undefined,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setState({ phase: "error", message: "You have already submitted a report for this event." });
        return;
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setState({ phase: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }

      setState({ phase: "success" });
    } catch {
      setState({ phase: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  const isSubmitting = state.phase === "submitting";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        aria-label="Report this event"
      >
        <Flag className="h-3 w-3" aria-hidden />
        Report this event
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this event</DialogTitle>
            <DialogDescription>
              Our trust team reviews every report within 24 hours. False reports may result in account action.
            </DialogDescription>
          </DialogHeader>

          {state.phase === "success" ? (
            <div className="space-y-4 py-2">
              <p className="rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                Thank you — our team reviews all reports within 24 hours.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="report-reason">Reason</Label>
                <Select
                  value={reason}
                  onValueChange={(v) => setReason(v as ReportReason)}
                  required
                >
                  <SelectTrigger id="report-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-detail">
                  Additional details{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="report-detail"
                  placeholder="Describe what happened..."
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-email">
                  Your email{" "}
                  <span className="text-muted-foreground">(optional, for follow-up)</span>
                </Label>
                <Input
                  id="report-email"
                  type="email"
                  placeholder="you@example.com"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                />
              </div>

              {state.phase === "error" ? (
                <p className="rounded-lg border border-red-700/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                  {state.message}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting || !reason}
                >
                  {isSubmitting ? "Submitting..." : "Submit report"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
