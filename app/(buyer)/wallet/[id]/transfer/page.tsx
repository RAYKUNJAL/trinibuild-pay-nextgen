"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferRequestCard } from "@/components/transfer-request-card";
import { TransferHistory } from "@/components/transfer-history";
import type { TicketTransfer } from "@/components/transfer-history";
import { ArrowLeft, Send, MessageCircle, CheckCircle2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PassData {
  id: string;
  holder_name: string | null;
  status: string;
  code: string;
  event_id: string;
  events: {
    title: string;
    venue: string;
    city: string;
    starts_at: string;
    gate_open_at: string | null;
  } | null;
  ticket_tiers: { name: string } | null;
}

interface PolicyData {
  transfers_allowed: boolean;
  max_transfers_per_pass: number;
  transfers_close_hours_before: number;
}

interface PendingTransfer {
  id: string;
  toPhone: string;
  toName: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  message: string | null;
  expiresAt: string;
  acceptUrl: string;
  passId: string;
}

interface TransferResult {
  transferId: string;
  transferToken: string;
  expiresAt: string;
  acceptUrl: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TransferPage() {
  const params = useParams();
  const passId = typeof params.id === "string" ? params.id : (params.id as string[])[0];

  const [pass, setPass] = useState<PassData | null>(null);
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [history, setHistory] = useState<TicketTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const [toPhone, setToPhone] = useState("");
  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "https://wefetepass.com";

  // Load pass + policy + transfers from the page itself (client-side via fetch)
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const passRes = await fetch(`/api/internal/pass-with-policy/${passId}`).catch(() => null);
        if (passRes?.ok) {
          const data = await passRes.json() as {
            pass: PassData;
            policy: PolicyData;
            pendingTransfer: PendingTransfer | null;
            history: TicketTransfer[];
          };
          setPass(data.pass);
          setPolicy(data.policy);
          setPendingTransfer(data.pendingTransfer);
          setHistory(data.history);
        }
      } catch {
        // no-op — form still usable without pre-loaded data
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [passId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!toPhone.trim()) {
      setFormError("Recipient phone number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/passes/${passId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: toPhone.trim(),
          toName: toName.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json() as TransferResult & { error?: string };

      if (!res.ok) {
        setFormError(data.error ?? "Failed to initiate transfer. Please try again.");
        return;
      }

      setResult({ ...data, acceptUrl: data.acceptUrl });
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelled() {
    setPendingTransfer(null);
    setResult(null);
  }

  const acceptUrl = result?.acceptUrl ?? "";
  const whatsappText = encodeURIComponent(
    `Hey! I'm sending you a ticket. Tap this link to claim it:\n${acceptUrl}`,
  );

  const closeHours = policy?.transfers_close_hours_before ?? 2;
  const maxTransfers = policy?.max_transfers_per_pass ?? 2;

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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
        <h1 className="text-2xl font-bold tracking-tight">Transfer Ticket</h1>
        {pass && (
          <p className="mt-1 text-sm text-muted-foreground">
            {pass.events?.title ?? "Event"} &middot;{" "}
            {pass.ticket_tiers?.name ?? "General"}
          </p>
        )}
      </div>

      {/* Policy notice */}
      {policy && (
        <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Transfer rules:</strong>{" "}
            Transfers close {closeHours} hour{closeHours !== 1 ? "s" : ""} before gates open.
            Each ticket can be transferred up to {maxTransfers} time{maxTransfers !== 1 ? "s" : ""}.
          </p>
        </div>
      )}

      {/* Pending transfer already exists */}
      {pendingTransfer && !result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have an active pending transfer for this ticket.
          </p>
          <TransferRequestCard transfer={pendingTransfer} onCancelled={handleCancelled} />
        </div>
      )}

      {/* Success state */}
      {result && (
        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
              <CardTitle className="text-base text-emerald-300">Transfer Initiated</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with {toPhone} so they can claim the ticket. The link expires{" "}
              {new Date(result.expiresAt).toLocaleDateString("en-TT", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}.
            </p>

            <div className="rounded-md border border-emerald-800/30 bg-black/40 px-3 py-2">
              <p className="break-all font-mono text-xs text-emerald-300/80">{result.acceptUrl}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]"
              >
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Share on WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(result.acceptUrl);
                }}
              >
                Copy Link
              </Button>
            </div>

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setResult(null)}
            >
              Send to someone else
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transfer form — only show if no pending transfer and no success */}
      {!pendingTransfer && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="toPhone">
                  Recipient&apos;s Phone Number{" "}
                  <span className="text-muted-foreground font-normal">(T&T format)</span>
                </Label>
                <Input
                  id="toPhone"
                  type="tel"
                  placeholder="+1 868 XXX XXXX"
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  They&apos;ll receive a link to accept the ticket at this number.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toName">
                  Recipient&apos;s Name{" "}
                  <span className="text-muted-foreground font-normal">(optional — for the pass)</span>
                </Label>
                <Input
                  id="toName"
                  type="text"
                  placeholder="Full name"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Personal Message{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="e.g. Enjoy the fete!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  maxLength={280}
                />
              </div>

              {formError && (
                <p className="rounded-md border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-400">
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" aria-hidden />
                {submitting ? "Sending…" : "Send Transfer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transfer history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transfer History
            </p>
            <Separator className="flex-1" />
          </div>
          <TransferHistory
            transfers={history}
            currentUserId=""
          />
        </div>
      )}

      {/* Name correction link */}
      <div className="border-t border-muted pt-4">
        <p className="text-xs text-muted-foreground">
          Wrong name on the ticket?{" "}
          <Link
            href={`/wallet/${passId}/name-correction`}
            className="text-foreground underline underline-offset-2 hover:no-underline"
          >
            Correct the name
          </Link>
        </p>
      </div>
    </div>
  );
}
