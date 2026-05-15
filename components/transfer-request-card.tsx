"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { Copy, Check, X } from "lucide-react";

export interface PendingTransfer {
  id: string;
  toPhone: string;
  toName: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  message: string | null;
  expiresAt: string;
  acceptUrl: string;
  passId: string;
}

interface TransferRequestCardProps {
  transfer: PendingTransfer;
  onCancelled?: () => void;
}

function hoursUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.floor(ms / (1000 * 60));
    return `Expires in ~${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `Expires in ~${hours} hour${hours !== 1 ? "s" : ""}`;
}

export function TransferRequestCard({ transfer, onCancelled }: TransferRequestCardProps) {
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/passes/${transfer.passId}/transfer`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Could not cancel transfer");
      }
      onCancelled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(transfer.acceptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  }

  const expiry = hoursUntil(transfer.expiresAt);
  const isExpired = expiry === "Expired";

  return (
    <Card className="border-amber-500/30 bg-amber-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-amber-300">
            Transfer Pending
          </CardTitle>
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs">
            Awaiting Acceptance
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sending to</span>
            <span className="font-medium">
              {transfer.toPhone}
              {transfer.toName ? ` · ${transfer.toName}` : ""}
            </span>
          </div>
          {transfer.message && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Message</span>
              <span className="text-right text-muted-foreground italic">&ldquo;{transfer.message}&rdquo;</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expires</span>
            <span className={isExpired ? "text-red-400 font-medium" : "font-medium"}>
              {isExpired ? formatDateTime(transfer.expiresAt) : expiry}
            </span>
          </div>
        </div>

        <Separator className="bg-amber-800/30" />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Share this link with the recipient — they&apos;ll use it to claim the ticket:
          </p>
          <div className="flex items-center gap-2 rounded-md border border-amber-800/30 bg-black/40 px-3 py-2">
            <p className="flex-1 truncate font-mono text-xs text-amber-300/80">
              {transfer.acceptUrl}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-amber-400 hover:text-amber-300"
              onClick={handleCopy}
              aria-label="Copy accept link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="ml-1.5 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-red-800/40 text-red-400 hover:bg-red-950/30 hover:text-red-300"
          onClick={handleCancel}
          disabled={cancelling || isExpired}
        >
          <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {cancelling ? "Cancelling…" : "Cancel Transfer"}
        </Button>
      </CardContent>
    </Card>
  );
}
