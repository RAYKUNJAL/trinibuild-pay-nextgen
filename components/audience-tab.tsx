"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AudienceKey = "buyers" | "promoters";

export function AudienceTab({
  buyers,
  promoters,
  defaultValue = "buyers",
  className,
}: {
  buyers: ReactNode;
  promoters: ReactNode;
  defaultValue?: AudienceKey;
  className?: string;
}) {
  const [value, setValue] = useState<AudienceKey>(defaultValue);

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Audience"
        className="inline-flex rounded-full border border-border/60 bg-muted/50 p-1"
      >
        {(["buyers", "promoters"] as const).map((key) => {
          const active = value === key;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setValue(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "buyers" ? "For Buyers" : "For Promoters"}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-6">
        {value === "buyers" ? buyers : promoters}
      </div>
    </div>
  );
}
