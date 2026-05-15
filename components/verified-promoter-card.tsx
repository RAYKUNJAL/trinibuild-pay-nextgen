import Image from "next/image";
import { CalendarDays, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustBadge } from "@/components/trust-badge";

export type VerifiedPromoterCardProps = {
  brandName: string;
  logoUrl?: string;
  verified: boolean;
  trustScore: number;
  eventsCount: number;
  joinedDate: string;
};

function TrustMeter({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color =
    clampedScore >= 80
      ? "bg-emerald-500"
      : clampedScore >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-400">
          Trust score
        </span>
        <span className="text-[11px] font-semibold text-neutral-200">{clampedScore}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${clampedScore}%` }}
          role="meter"
          aria-valuenow={clampedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Trust score: ${clampedScore} out of 100`}
        />
      </div>
    </div>
  );
}

export function VerifiedPromoterCard({
  brandName,
  logoUrl,
  verified,
  trustScore,
  eventsCount,
  joinedDate,
}: VerifiedPromoterCardProps) {
  const year = new Date(joinedDate).getFullYear();

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0d0c0a] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Top accent bar */}
      {verified && (
        <div className="h-[3px] w-full bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31]" />
      )}

      <div className="space-y-4 p-5">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-900">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${brandName} logo`}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-400">
                {brandName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-neutral-100">{brandName}</p>
            <div className="mt-0.5">
              <TrustBadge verified={verified} size="sm" />
            </div>
          </div>
        </div>

        {/* Trust meter */}
        <TrustMeter score={trustScore} />

        {/* Stats */}
        <div className="flex items-center gap-4 border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 shrink-0 text-[#d8ab5b]/70" aria-hidden />
            {eventsCount} {eventsCount === 1 ? "event" : "events"} hosted
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#d8ab5b]/70" aria-hidden />
            Member since {year}
          </span>
        </div>
      </div>
    </div>
  );
}
