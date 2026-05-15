import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

interface GuestListEntry {
  id: string;
  name: string;
  phone: string | null;
  tierName: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  notes: string | null;
}

interface Props {
  entry: GuestListEntry;
  eventId: string;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.length <= 4) return "****";
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}

export function GuestListRow({ entry, eventId: _eventId }: Props) {
  return (
    <tr className="border-t border-border/60 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium leading-tight">{entry.name}</p>
        {entry.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
        {maskPhone(entry.phone)}
      </td>
      <td className="px-4 py-3 text-sm">
        {entry.tierName ? (
          <Badge variant="secondary" className="text-xs">
            {entry.tierName}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {entry.checkedIn ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
              In
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Pending
            </Badge>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {entry.checkedInAt ? formatDateTime(entry.checkedInAt) : "—"}
      </td>
    </tr>
  );
}
