import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EventStatus =
  | "draft"
  | "scheduled"
  | "on_sale"
  | "sold_out"
  | "live"
  | "ended"
  | "cancelled";

const map: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-900" },
  on_sale: { label: "On sale", className: "bg-emerald-100 text-emerald-900" },
  sold_out: { label: "Sold out", className: "bg-brand-red text-white" },
  live: { label: "Live", className: "bg-amber-100 text-amber-900" },
  ended: { label: "Ended", className: "bg-zinc-200 text-zinc-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-900" },
};

export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const info = map[status] ?? map.scheduled;
  return (
    <Badge className={cn("border-transparent hover:bg-current/0", info.className, className)}>
      {info.label}
    </Badge>
  );
}
