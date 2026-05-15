"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTTD, formatDateTime } from "@/lib/utils";

type TierSelection = {
  tierId: string;
  quantity: number;
};

type AbandonedCheckoutRowProps = {
  session: {
    id: string;
    buyerName: string | null;
    buyerPhone: string | null;
    eventTitle: string;
    subtotalCents: number;
    abandonedAt: string;
    tierSelections: TierSelection[];
  };
};

export function AbandonedCheckoutRow({ session }: AbandonedCheckoutRowProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const displayName = session.buyerName ?? "Anonymous";
  const tierCount = session.tierSelections.reduce((sum, t) => sum + t.quantity, 0);

  async function handleSendReminder() {
    if (!session.buyerPhone) {
      toast.error("No phone number available for this buyer");
      return;
    }

    setSending(true);
    try {
      const message = `Hi ${session.buyerName ?? "there"}! You left tickets for *${session.eventTitle}* in your cart worth ${formatTTD(session.subtotalCents)}. Complete your order before they sell out: 🎟️`;

      const response = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: message,
          channel: "whatsapp",
        }),
      });

      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to send reminder");
      }

      setSent(true);
      toast.success(`Recovery message sent to ${displayName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setSending(false);
    }
  }

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 pl-4 pr-3 text-sm">
        <p className="font-medium text-foreground">{displayName}</p>
        {session.buyerPhone && (
          <p className="text-xs text-muted-foreground mt-0.5">{session.buyerPhone}</p>
        )}
      </td>
      <td className="py-3 px-3 text-sm text-muted-foreground">{session.eventTitle}</td>
      <td className="py-3 px-3 text-sm font-medium tabular-nums">
        {formatTTD(session.subtotalCents)}
      </td>
      <td className="py-3 px-3 text-sm text-muted-foreground">
        <p>{formatDateTime(session.abandonedAt)}</p>
        <p className="text-xs mt-0.5">
          {tierCount} ticket{tierCount !== 1 ? "s" : ""}
        </p>
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReminder}
          disabled={sending || sent || !session.buyerPhone}
          className="gap-1.5 text-xs"
        >
          {sending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-3 w-3" aria-hidden />
          )}
          {sent ? "Sent" : "Send Reminder"}
        </Button>
      </td>
    </tr>
  );
}
