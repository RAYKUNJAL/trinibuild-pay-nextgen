import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export interface TicketTransfer {
  id: string;
  pass_id: string;
  from_buyer_id: string;
  to_phone: string;
  to_buyer_id: string | null;
  to_name: string | null;
  event_id: string;
  transfer_token: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TransferHistoryProps {
  transfers: TicketTransfer[];
  currentUserId: string;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `+1 868 ***-${digits.slice(-4)}`;
}

const statusConfig: Record<
  TicketTransfer["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  },
  accepted: {
    label: "Accepted",
    className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  },
  declined: {
    label: "Declined",
    className: "border-red-500/50 bg-red-500/10 text-red-400",
  },
  expired: {
    label: "Expired",
    className: "border-neutral-600/50 bg-neutral-800/40 text-neutral-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-neutral-600/50 bg-neutral-800/40 text-neutral-500",
  },
};

export function TransferHistory({ transfers, currentUserId }: TransferHistoryProps) {
  if (transfers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No transfer history.</p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Transfer history">
      {transfers.map((t) => {
        const isSent = t.from_buyer_id === currentUserId;
        const { label, className } = statusConfig[t.status];
        const date =
          t.status === "accepted" && t.accepted_at
            ? t.accepted_at
            : t.status === "declined" && t.declined_at
              ? t.declined_at
              : t.created_at;

        return (
          <li
            key={t.id}
            className="flex flex-col gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {isSent ? "Sent to" : "Received from"}
                </span>
                <span className="font-medium text-neutral-200">
                  {maskPhone(t.to_phone)}
                  {t.to_name ? ` (${t.to_name})` : ""}
                </span>
              </div>
              <Badge variant="outline" className={className}>
                {label}
              </Badge>
            </div>

            {t.message && (
              <p className="text-xs italic text-neutral-500">&ldquo;{t.message}&rdquo;</p>
            )}

            <p className="text-xs text-neutral-600">{formatDateTime(date)}</p>
          </li>
        );
      })}
    </ol>
  );
}
