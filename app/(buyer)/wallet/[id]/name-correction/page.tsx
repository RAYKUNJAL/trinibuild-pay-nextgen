"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PassData {
  id: string;
  holder_name: string | null;
  status: string;
  events: { title: string; starts_at: string } | null;
  ticket_tiers: { name: string } | null;
}

interface CorrectResult {
  corrected: boolean;
  oldName: string | null;
  newName: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NameCorrectionPage() {
  const params = useParams();
  const passId = typeof params.id === "string" ? params.id : (params.id as string[])[0];

  const [pass, setPass] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectResult | null>(null);

  // Attempt to load pass data via the existing pass detail API shape
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // We call a light endpoint — fall back gracefully if not available
        const res = await fetch(`/api/passes/${passId}/name-correction-data`).catch(() => null);
        if (res?.ok) {
          const data = await res.json() as PassData;
          setPass(data);
          setNewName(data.holder_name ?? "");
        }
      } catch {
        // no-op — form still works without pre-loaded data
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [passId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError("Please enter the corrected name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/passes/${passId}/correct-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newName: newName.trim(),
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json() as CorrectResult & { error?: string };

      if (!res.ok) {
        setFormError(data.error ?? "Failed to update name. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back */}
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/wallet/${passId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Back to pass
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Correct Name on Ticket</h1>
        {pass && (
          <p className="mt-1 text-sm text-muted-foreground">
            {pass.events?.title ?? "Your ticket"} &middot;{" "}
            {pass.ticket_tiers?.name ?? "General"}
          </p>
        )}
      </div>

      {/* Success */}
      {result ? (
        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
            <div>
              <p className="font-semibold text-emerald-300">Name Updated</p>
              {result.oldName && result.oldName !== result.newName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Changed from &ldquo;{result.oldName}&rdquo; to &ldquo;{result.newName}&rdquo;
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                Your QR code is the same — it still works at the door.
              </p>
            </div>
            <Button asChild>
              <Link href={`/wallet/${passId}`}>View Pass</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" aria-hidden />
              Update Holder Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              {/* Current name */}
              {pass?.holder_name && (
                <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current name on ticket
                  </p>
                  <p className="mt-1 font-medium">{pass.holder_name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newName">Corrected Name</Label>
                <Input
                  id="newName"
                  type="text"
                  placeholder="Full legal name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the name as it should appear on the ticket. This does not affect your QR code.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="e.g. Typo in original order, gift for someone else…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={280}
                />
              </div>

              {formError && (
                <p className="rounded-md border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-400">
                  {formError}
                </p>
              )}

              <div className="rounded-lg border border-muted bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Name changes are logged for security.
                Your QR code remains the same and will still work at the door.
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Updating…" : "Update Name"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transfer link */}
      <div className="border-t border-muted pt-4">
        <p className="text-xs text-muted-foreground">
          Need to send this ticket to someone else?{" "}
          <Link
            href={`/wallet/${passId}/transfer`}
            className="text-foreground underline underline-offset-2 hover:no-underline"
          >
            Transfer ticket
          </Link>
        </p>
      </div>
    </div>
  );
}
