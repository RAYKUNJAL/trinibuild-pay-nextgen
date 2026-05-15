"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  MapPin,
  CalendarDays,
  User,
  MessageCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransferPreview {
  id: string;
  passId: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  toPhone: string;
  toName: string | null;
  message: string | null;
  expiresAt: string;
  fromName: string | null;
  event: {
    title: string;
    venue: string;
    city: string;
    starts_at: string;
  };
  tier: string;
}

interface AcceptResult {
  accepted: boolean;
  passId: string;
  newQrToken: string;
}

// ─── Inner client component ──────────────────────────────────────────────────

function AcceptPageInner({ passId, token }: { passId: string; token: string }) {
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<AcceptResult | null>(null);
  const [declined, setDeclined] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreview() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/passes/${passId}/transfer-preview?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          setLoadError(data.error ?? "Transfer not found");
          return;
        }
        const data = await res.json() as TransferPreview;
        setPreview(data);
        if (data.toName) setRecipientName(data.toName);
      } catch {
        setLoadError("Could not load transfer details.");
      } finally {
        setLoading(false);
      }
    }
    void loadPreview();
  }, [passId, token]);

  async function handleAccept() {
    if (!recipientPhone.trim()) {
      setActionError("Please enter your phone number to verify you are the intended recipient.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/passes/${passId}/accept-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferToken: token,
          recipientPhone: recipientPhone.trim(),
          recipientName: recipientName.trim() || undefined,
        }),
      });
      const data = await res.json() as AcceptResult & { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Could not accept transfer");
        return;
      }
      setAccepted(data);
      // Build a QR via the pass detail page rather than calling the server lib directly
      // The full pass view at /wallet/[passId] will render the QR
      setQrUrl(null);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/passes/${passId}/transfer-preview?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setActionError(data.error ?? "Could not decline transfer");
        return;
      }
      setDeclined(true);
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-red-800/30 bg-red-950/10">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <XCircle className="h-10 w-10 text-red-400" aria-hidden />
          <p className="font-semibold text-red-300">{loadError}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/discover">Browse Events</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!preview) return null;

  // ── Expired / already processed ───────────────────────────────────────────

  if (preview.status === "expired" || new Date(preview.expiresAt) < new Date()) {
    return (
      <Card className="border-neutral-800">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Clock className="h-10 w-10 text-neutral-500" aria-hidden />
          <p className="font-semibold text-neutral-300">This transfer has expired.</p>
          <p className="text-sm text-muted-foreground">
            The sender can initiate a new transfer from their wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (preview.status === "accepted" && !accepted) {
    return (
      <Card className="border-emerald-800/30 bg-emerald-950/10">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden />
          <p className="font-semibold text-emerald-300">This ticket has already been accepted.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/wallet">Go to my wallet</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (preview.status === "declined" || declined) {
    return (
      <Card className="border-neutral-800">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <XCircle className="h-10 w-10 text-neutral-400" aria-hidden />
          <p className="font-semibold text-neutral-300">Transfer declined.</p>
          <p className="text-sm text-muted-foreground">
            The sender has been notified. Their ticket remains with them.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Accepted success ───────────────────────────────────────────────────────

  if (accepted) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-950/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
            <CardTitle className="text-base text-emerald-300">Ticket Accepted!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your ticket to{" "}
            <strong className="text-foreground">{preview.event.title}</strong> is ready.
            Show the QR code at the door.
          </p>

          {qrUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Your QR pass"
                className="h-48 w-48 rounded-lg border border-muted"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={`/wallet/${accepted.passId}`}>View Full Pass</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/wallet">My Wallet</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Keep your screen brightness up at the door. One scan only.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Main acceptance form ───────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Event details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Ticket Transfer
              </p>
              <CardTitle className="text-xl leading-snug">{preview.event.title}</CardTitle>
            </div>
            <Badge variant="outline" className="shrink-0 border-amber-500/40 text-amber-400">
              {preview.tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
            <span>{formatDateTime(preview.event.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span>{preview.event.venue}, {preview.event.city}</span>
          </div>
          {preview.fromName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              <span>From {preview.fromName}</span>
            </div>
          )}
          {preview.message && (
            <div className="flex items-start gap-2 text-sm">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="italic text-muted-foreground">&ldquo;{preview.message}&rdquo;</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" aria-hidden />
            Claim This Ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the phone number this ticket was sent to. This verifies you are the intended recipient.
          </p>

          <div className="space-y-2">
            <Label htmlFor="recipientPhone">Your Phone Number</Label>
            <Input
              id="recipientPhone"
              type="tel"
              placeholder="+1 868 XXX XXXX"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">
              Your Name{" "}
              <span className="font-normal text-muted-foreground">(will appear on the ticket)</span>
            </Label>
            <Input
              id="recipientName"
              type="text"
              placeholder="Full name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {actionError && (
            <p className="rounded-md border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {actionError}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={() => void handleAccept()}
              disabled={submitting}
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
              {submitting ? "Accepting…" : "Accept Ticket"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDecline()}
              disabled={submitting}
              className="w-full text-muted-foreground"
            >
              Decline
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expires</span>
            <span>{formatDateTime(preview.expiresAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function AcceptTransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const passId = typeof params.id === "string" ? params.id : (params.id as string[])[0];
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="border-red-800/30 bg-red-950/10">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="h-10 w-10 text-red-400" aria-hidden />
            <p className="font-semibold text-red-300">Invalid transfer link.</p>
            <p className="text-sm text-muted-foreground">
              Please ask the sender to share the link again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          WeFetePass
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Someone sent you a ticket</h1>
      </div>
      <AcceptPageInner passId={passId} token={token} />
    </div>
  );
}
