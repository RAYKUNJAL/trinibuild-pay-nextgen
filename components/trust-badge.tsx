import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustBadgeProps = {
  verified: boolean;
  trustScore?: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
};

const sizeMap = {
  sm: {
    wrapper: "gap-1 px-2 py-0.5 text-[10px]",
    icon: "h-3 w-3",
  },
  md: {
    wrapper: "gap-1.5 px-2.5 py-1 text-xs",
    icon: "h-3.5 w-3.5",
  },
  lg: {
    wrapper: "gap-2 px-3 py-1.5 text-sm",
    icon: "h-4 w-4",
  },
};

export function TrustBadge({
  verified,
  trustScore,
  size = "md",
  showScore = false,
}: TrustBadgeProps) {
  const s = sizeMap[size];

  if (!verified) {
    if (!showScore) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-neutral-600/50 bg-neutral-800/60 font-medium tracking-wide text-neutral-400",
          s.wrapper,
        )}
      >
        <span className={cn("rounded-full bg-neutral-600", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
        Unverified
        {showScore && typeof trustScore === "number" ? (
          <span className="ml-1 opacity-70">· {trustScore}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      title="Verified by WeFetePass — identity and business confirmed."
      aria-label="Verified by WeFetePass"
      className={cn(
        "inline-flex items-center rounded-full border border-[#d8ab5b]/60 bg-[#0d0b07] font-semibold tracking-wide text-[#e8c87a] shadow-[0_0_12px_rgba(216,171,91,0.18)]",
        s.wrapper,
      )}
    >
      <CheckCircle2
        className={cn("shrink-0 text-[#d8ab5b]", s.icon)}
        aria-hidden
      />
      Verified
      {showScore && typeof trustScore === "number" ? (
        <span className="ml-1 opacity-80">· {trustScore}</span>
      ) : null}
    </span>
  );
}
