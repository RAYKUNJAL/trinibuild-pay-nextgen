import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "success";
}

export function MetricCard({ label, value, hint, tone = "default" }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        tone === "warn" && "border-amber-500/40 bg-amber-500/5",
        tone === "danger" && "border-red-500/40 bg-red-500/5",
        tone === "success" && "border-emerald-500/40 bg-emerald-500/5",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
