import { cn, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";

type DisputeStatus =
  | "open"
  | "organizer_responded"
  | "under_review"
  | "resolved_buyer"
  | "resolved_organizer"
  | "closed";

export interface DisputeStatusCardProps {
  dispute: {
    id: string;
    status: DisputeStatus;
    summary: string;
    createdAt: string;
    resolvedAt?: string | null;
    resolutionNote?: string | null;
  };
}

const STATUS_CONFIG: Record<
  DisputeStatus,
  {
    label: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  open: {
    label: "Open",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    borderClass: "border-amber-200",
    bgClass: "bg-amber-50",
    Icon: AlertTriangle,
  },
  organizer_responded: {
    label: "Organiser Responded",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
    borderClass: "border-blue-200",
    bgClass: "bg-blue-50",
    Icon: Info,
  },
  under_review: {
    label: "Under Review",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    borderClass: "border-purple-200",
    bgClass: "bg-purple-50",
    Icon: Info,
  },
  resolved_buyer: {
    label: "Resolved — Buyer Favour",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    borderClass: "border-emerald-200",
    bgClass: "bg-emerald-50",
    Icon: CheckCircle2,
  },
  resolved_organizer: {
    label: "Resolved — Organiser Favour",
    badgeClass: "bg-red-100 text-red-900 border-red-200",
    borderClass: "border-red-200",
    bgClass: "bg-red-50",
    Icon: XCircle,
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    borderClass: "border-zinc-200",
    bgClass: "bg-zinc-50",
    Icon: Info,
  },
};

export function DisputeStatusCard({ dispute }: DisputeStatusCardProps) {
  const status = dispute.status as DisputeStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  const { Icon } = config;

  return (
    <Card className={cn("border", config.borderClass)}>
      <CardContent className={cn("p-5 space-y-4", config.bgClass)}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <Icon
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              status === "open" ? "text-amber-600" : "",
              status === "resolved_buyer" ? "text-emerald-600" : "",
              status === "resolved_organizer" ? "text-red-600" : "",
              status === "organizer_responded" ? "text-blue-600" : "",
              status === "under_review" ? "text-purple-600" : "",
              status === "closed" ? "text-zinc-500" : "",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base">Dispute</h3>
              <Badge
                className={cn(
                  "border text-xs font-medium",
                  config.badgeClass,
                )}
              >
                {config.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Opened {formatDateTime(dispute.createdAt)}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Summary
          </p>
          <p className="text-sm">{dispute.summary}</p>
        </div>

        {/* Resolution note */}
        {dispute.resolutionNote ? (
          <div className="rounded-md border border-border/60 bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Resolution note
            </p>
            <p className="text-sm">{dispute.resolutionNote}</p>
            {dispute.resolvedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Resolved {formatDateTime(dispute.resolvedAt)}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* WeFetePass notice */}
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
          WeFetePass mediates all disputes within 5 business days. Our team
          reviews all evidence and communications fairly.
        </p>
      </CardContent>
    </Card>
  );
}
