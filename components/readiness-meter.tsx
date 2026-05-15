import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReadinessCheck = { label: string; done: boolean };

export function ReadinessMeter({
  score,
  checks,
}: {
  score: number;
  checks: ReadinessCheck[];
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tier =
    clamped >= 80 ? "green" : clamped >= 50 ? "amber" : "red";
  const colorClass =
    tier === "green" ? "text-emerald-500" : tier === "amber" ? "text-amber-500" : "text-brand-red";

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative inline-flex shrink-0 items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            className={cn("transition-all duration-500", colorClass)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-display text-3xl font-bold", colorClass)}>{clamped}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ready</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2" aria-label="Readiness checklist">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full",
                c.done ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
              )}
              aria-hidden
            >
              {c.done ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </span>
            <span className={cn(c.done ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
