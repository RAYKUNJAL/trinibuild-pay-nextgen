import { cn } from "@/lib/utils";

export type BuyerSegment = "vip" | "loyal" | "first_timer" | "lapsed" | "at_risk";

type CrmSegmentChipProps = {
  segment: BuyerSegment;
  count?: number;
};

const SEGMENT_CONFIG: Record<
  BuyerSegment,
  { label: string; className: string; dotClassName: string }
> = {
  vip: {
    label: "VIP",
    className: "bg-yellow-50 text-yellow-800 border-yellow-200",
    dotClassName: "bg-yellow-500",
  },
  loyal: {
    label: "Loyal",
    className: "bg-green-50 text-green-800 border-green-200",
    dotClassName: "bg-green-500",
  },
  first_timer: {
    label: "First Timer",
    className: "bg-blue-50 text-blue-800 border-blue-200",
    dotClassName: "bg-blue-500",
  },
  lapsed: {
    label: "Lapsed",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  at_risk: {
    label: "At Risk",
    className: "bg-red-50 text-red-800 border-red-200",
    dotClassName: "bg-red-500",
  },
};

export function CrmSegmentChip({ segment, count }: CrmSegmentChipProps) {
  const config = SEGMENT_CONFIG[segment];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClassName)} aria-hidden />
      {config.label}
      {count !== undefined && (
        <span className="ml-0.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
          {count}
        </span>
      )}
    </span>
  );
}
