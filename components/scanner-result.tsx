import { Check, AlertTriangle, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanResultKind = "valid" | "duplicate" | "invalid";

const styles: Record<
  ScanResultKind,
  { Icon: LucideIcon; title: string; tone: string; iconBg: string; iconText: string }
> = {
  valid: {
    Icon: Check,
    title: "Valid — Admit",
    tone: "border-emerald-500/40 bg-emerald-500/5",
    iconBg: "bg-emerald-500 text-white",
    iconText: "text-emerald-700",
  },
  duplicate: {
    Icon: AlertTriangle,
    title: "Already scanned",
    tone: "border-amber-500/40 bg-amber-500/5",
    iconBg: "bg-amber-500 text-white",
    iconText: "text-amber-700",
  },
  invalid: {
    Icon: X,
    title: "Invalid pass",
    tone: "border-brand-red/40 bg-brand-red/5",
    iconBg: "bg-brand-red text-white",
    iconText: "text-brand-red",
  },
};

export function ScannerResult({
  kind,
  holderName,
  tierName,
  detail,
}: {
  kind: ScanResultKind;
  holderName?: string;
  tierName?: string;
  detail?: string;
}) {
  const s = styles[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-5",
        s.tone,
      )}
    >
      <span className={cn("inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full", s.iconBg)}>
        <s.Icon className="h-7 w-7" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={cn("font-display text-xl font-bold", s.iconText)}>{s.title}</p>
        {holderName || tierName ? (
          <p className="mt-1 text-sm">
            {holderName ? <span className="font-medium">{holderName}</span> : null}
            {holderName && tierName ? <span className="text-muted-foreground"> — </span> : null}
            {tierName ? <span className="text-muted-foreground">{tierName}</span> : null}
          </p>
        ) : null}
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}
