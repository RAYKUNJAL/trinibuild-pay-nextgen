"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketTierSelector, type TicketTier } from "@/components/ticket-tier-selector";
import { formatTTD } from "@/lib/utils";

export function TicketTiers({ eventId, tiers }: { eventId: string; tiers: TicketTier[] }) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  const { totalQty, subtotalCents, query } = useMemo(() => {
    let q = 0;
    let s = 0;
    const parts: string[] = [];
    for (const t of tiers) {
      const n = selections[t.id] ?? 0;
      if (n > 0) {
        q += n;
        s += n * t.priceCents;
        parts.push(`${t.id}:${n}`);
      }
    }
    return { totalQty: q, subtotalCents: s, query: parts.join(",") };
  }, [selections, tiers]);

  return (
    <div className="space-y-4">
      <TicketTierSelector tiers={tiers} onChange={setSelections} />
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Subtotal · </span>
          <span className="font-semibold">{formatTTD(subtotalCents)}</span>
          <span className="ml-2 text-muted-foreground">
            ({totalQty} ticket{totalQty === 1 ? "" : "s"})
          </span>
        </div>
        <Button
          asChild
          disabled={totalQty === 0}
          className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
        >
          <Link href={totalQty > 0 ? `/checkout/${eventId}?tiers=${encodeURIComponent(query)}` : "#"}>
            Continue to checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}
