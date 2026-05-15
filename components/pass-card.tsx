import { Calendar, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, cn } from "@/lib/utils";

export type PassStatus = "valid" | "used" | "voided";

export type PassCardData = {
  id: string;
  eventTitle: string;
  eventStarts: string;
  venue?: string | null;
  holderName: string;
  code: string;
  tierName: string;
  status: PassStatus;
  qrUrl: string;
};

const statusStyle: Record<PassStatus, string> = {
  valid: "bg-emerald-100 text-emerald-900",
  used: "bg-zinc-200 text-zinc-700",
  voided: "bg-red-100 text-red-900",
};

export function PassCard({ pass }: { pass: PassCardData }) {
  const dimmed = pass.status !== "valid";
  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm",
        dimmed && "opacity-80",
      )}
      role="group"
      aria-label={`Pass for ${pass.eventTitle}`}
    >
      {/* perforated divider */}
      <span
        aria-hidden
        className="absolute top-1/2 left-[64%] hidden -translate-y-1/2 sm:block"
      >
        <span className="block h-full w-px [background:repeating-linear-gradient(to_bottom,hsl(var(--border))_0_6px,transparent_6px_12px)] h-40" />
      </span>
      <span
        aria-hidden
        className="absolute -left-2 left-[64%] top-1/2 hidden h-4 w-4 -translate-y-1/2 rounded-full bg-background sm:block"
        style={{ left: "calc(64% - 8px)", top: "-8px" }}
      />
      <span
        aria-hidden
        className="absolute hidden h-4 w-4 rounded-full bg-background sm:block"
        style={{ left: "calc(64% - 8px)", bottom: "-8px" }}
      />

      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {pass.tierName}
            </div>
            <h3 className="mt-1 font-display text-xl font-bold leading-tight">{pass.eventTitle}</h3>
          </div>
          <Badge className={cn("border-transparent", statusStyle[pass.status])}>
            {pass.status.toUpperCase()}
          </Badge>
        </div>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            <span>{formatDateTime(pass.eventStarts)}</span>
          </div>
          {pass.venue ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              <span>{pass.venue}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" aria-hidden />
            <span>{pass.holderName}</span>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-md border border-dashed border-border px-2 py-1 font-mono text-xs tracking-widest">
          {pass.code}
        </div>
      </div>

      <div className="flex w-[180px] flex-col items-center justify-center gap-2 border-l border-dashed border-border bg-muted/30 p-4 sm:w-[200px]">
        {/* QR is provided as a data url */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pass.qrUrl}
          alt={`QR for pass ${pass.code}`}
          className={cn("h-32 w-32 rounded-md bg-white p-1", dimmed && "grayscale")}
        />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Scan at door</span>
      </div>
    </div>
  );
}
