"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatTTD } from "@/lib/utils";
import { CheckCircle2, XCircle, CreditCard } from "lucide-react";

type Mode = "idle" | "approve" | "partial" | "deny";

interface RespondActionsProps {
  refundId: string;
  amountCents: number;
}

export function RespondActions({ refundId, amountCents }: RespondActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [note, setNote] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode("idle");
    setNote("");
    setPartialAmount("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please provide a response note for the buyer.");
      return;
    }

    let approvedAmountCents: number | undefined;
    if (mode === "partial") {
      const parsed = Math.round(parseFloat(partialAmount) * 100);
      if (!partialAmount || isNaN(parsed) || parsed <= 0) {
        setError("Please enter a valid partial amount.");
        return;
      }
      if (parsed > amountCents) {
        setError(
          `Partial amount cannot exceed the requested amount of ${formatTTD(amountCents)}.`,
        );
        return;
      }
      approvedAmountCents = parsed;
    }

    const decision =
      mode === "deny" ? "deny" : mode === "partial" ? "partial" : "approve";

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/refunds/${refundId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note: note.trim(),
          approvedAmountCents,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "Failed to submit response.");
        return;
      }

      router.refresh();
      router.push("/dashboard/disputes");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        <h2 className="font-display text-lg font-semibold">Your Decision</h2>
        <Separator />

        {mode === "idle" ? (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setMode("approve")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              size="sm"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
              Approve Full Refund ({formatTTD(amountCents)})
            </Button>
            <Button
              onClick={() => setMode("partial")}
              variant="outline"
              size="sm"
            >
              <CreditCard className="mr-1.5 h-4 w-4" aria-hidden />
              Approve Partial Refund
            </Button>
            <Button
              onClick={() => setMode("deny")}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="mr-1.5 h-4 w-4" aria-hidden />
              Deny Request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium">
              {mode === "approve" && (
                <span className="text-emerald-700">
                  Approving full refund: {formatTTD(amountCents)}
                </span>
              )}
              {mode === "partial" && (
                <span className="text-blue-700">Approving partial refund</span>
              )}
              {mode === "deny" && (
                <span className="text-red-700">Denying refund request</span>
              )}
            </div>

            {mode === "partial" ? (
              <div className="space-y-2">
                <Label htmlFor="partialAmount">
                  Approved amount (TTD, max {formatTTD(amountCents)})
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="partialAmount"
                    type="number"
                    min="0.01"
                    max={(amountCents / 100).toFixed(2)}
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="note">
                {mode === "deny"
                  ? "Reason for denial (shared with buyer)"
                  : "Note for buyer"}
              </Label>
              <Textarea
                id="note"
                placeholder={
                  mode === "deny"
                    ? "Explain why the refund cannot be approved…"
                    : "Any message you'd like to send to the buyer…"
                }
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={loading}
                className={
                  mode === "deny"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }
                size="sm"
              >
                {loading
                  ? "Submitting…"
                  : mode === "approve"
                    ? "Confirm Approval"
                    : mode === "partial"
                      ? "Confirm Partial Approval"
                      : "Confirm Denial"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
