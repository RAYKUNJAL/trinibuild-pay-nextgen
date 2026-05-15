"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { ShoppingCart, MessageCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTTD } from "@/lib/utils";
import { AbandonedCheckoutRow } from "@/components/abandoned-checkout-row";

type TierSelection = {
  tierId: string;
  quantity: number;
};

type AbandonedSession = {
  id: string;
  buyerName: string | null;
  buyerPhone: string | null;
  eventTitle: string;
  subtotalCents: number;
  abandonedAt: string;
  tierSelections: TierSelection[];
};

type RawSession = {
  id: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  subtotal_cents: number;
  abandoned_at: string;
  tier_selections: TierSelection[];
  events: { title: string } | null;
};

export default function AbandonedCheckoutsPage() {
  const [sessions, setSessions] = useState<AbandonedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingAll, startSendAll] = useTransition();

  useEffect(() => {
    fetch("/api/checkout/abandoned")
      .then((r) => r.json())
      .then((json: { sessions?: RawSession[]; error?: string }) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        const mapped: AbandonedSession[] = (json.sessions ?? []).map((s) => ({
          id: s.id,
          buyerName: s.buyer_name,
          buyerPhone: s.buyer_phone,
          eventTitle: s.events?.title ?? "Unknown Event",
          subtotalCents: s.subtotal_cents,
          abandonedAt: s.abandoned_at,
          tierSelections: s.tier_selections ?? [],
        }));
        setSessions(mapped);
      })
      .catch(() => toast.error("Failed to load abandoned checkouts"))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = sessions.reduce((sum, s) => sum + s.subtotalCents, 0);
  const withPhone = sessions.filter((s) => s.buyerPhone);

  function handleSendAll() {
    if (withPhone.length === 0) {
      toast.error("No buyers with phone numbers to message");
      return;
    }

    startSendAll(async () => {
      let successCount = 0;
      let failCount = 0;

      for (const session of withPhone) {
        try {
          const message = `Hi ${session.buyerName ?? "there"}! You left tickets for *${session.eventTitle}* in your cart worth ${formatTTD(session.subtotalCents)}. Complete your order before they sell out! 🎟️`;
          const response = await fetch("/api/broadcasts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: message,
              channel: "whatsapp",
            }),
          });
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Recovery messages sent to ${successCount} buyer${successCount !== 1 ? "s" : ""}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to send ${failCount} message${failCount !== 1 ? "s" : ""}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Abandoned Checkouts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recover lost sales with targeted WhatsApp reminders.
          </p>
        </div>
        <Button
          onClick={handleSendAll}
          disabled={isSendingAll || loading || withPhone.length === 0}
          className="gap-1.5"
          size="sm"
        >
          {isSendingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden />
          )}
          Send Recovery to All ({withPhone.length})
        </Button>
      </div>

      {/* Summary banner */}
      {!loading && sessions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <ShoppingCart className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
            <p className="text-sm text-amber-800">
              <strong>{sessions.length}</strong> abandoned checkout
              {sessions.length !== 1 ? "s" : ""} worth{" "}
              <strong>{formatTTD(totalValue)}</strong> in the last 7 days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Abandoned Checkouts (7 days)</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 divide-y divide-border/60">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-8 w-28" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
              <p className="text-sm font-medium">No abandoned checkouts</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Checkout sessions will appear here when buyers leave without purchasing.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="py-2 pl-4 pr-3 text-left text-xs font-medium text-muted-foreground">
                    Buyer
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                    Event
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                    Abandoned
                  </th>
                  <th className="py-2 pl-3 pr-4 text-right text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <AbandonedCheckoutRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
