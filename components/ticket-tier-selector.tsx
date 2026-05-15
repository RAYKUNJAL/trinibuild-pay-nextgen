"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTTD, cn } from "@/lib/utils";

export type TicketTier = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  quantityRemaining: number;
};

export function TicketTierSelector({
  tiers,
  onChange,
  maxPerOrder = 10,
}: {
  tiers: TicketTier[];
  onChange: (selections: Record<string, number>) => void;
  maxPerOrder?: number;
}) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  useEffect(() => {
    onChange(selections);
  }, [selections, onChange]);

  const setQty = useCallback((id: string, qty: number, max: number) => {
    setSelections((prev) => {
      const clamped = Math.max(0, Math.min(qty, Math.min(max, maxPerOrder)));
      if (clamped === 0) {
        const { [id]: _omit, ...rest } = prev;
        void _omit;
        return rest;
      }
      return { ...prev, [id]: clamped };
    });
  }, [maxPerOrder]);

  return (
    <ul className="divide-y divide-border rounded-xl border border-border/60">
      {tiers.map((tier) => {
        const soldOut = tier.quantityRemaining <= 0;
        const qty = selections[tier.id] ?? 0;
        return (
          <li
            key={tier.id}
            className={cn(
              "flex items-center justify-between gap-4 p-4 sm:p-5",
              soldOut && "opacity-60",
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold">{tier.name}</h4>
                {soldOut ? (
                  <Badge className="bg-brand-red text-white hover:bg-brand-red">Sold out</Badge>
                ) : tier.quantityRemaining <= 10 ? (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                    Only {tier.quantityRemaining} left
                  </Badge>
                ) : null}
              </div>
              {tier.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
              ) : null}
              <p className="mt-1 text-sm font-medium">{formatTTD(tier.priceCents)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty(tier.id, qty - 1, tier.quantityRemaining)}
                disabled={soldOut || qty === 0}
                aria-label={`Decrease ${tier.name} quantity`}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {qty}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty(tier.id, qty + 1, tier.quantityRemaining)}
                disabled={soldOut || qty >= Math.min(tier.quantityRemaining, maxPerOrder)}
                aria-label={`Increase ${tier.name} quantity`}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
