import { cn, formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  FileText,
} from "lucide-react";

type ActorRole = "buyer" | "organizer" | "admin" | "system";
type EventType =
  | "created"
  | "organizer_responded"
  | "approved"
  | "denied"
  | "payment_initiated"
  | "completed"
  | "escalated";

export interface RefundTimelineEvent {
  id: string;
  actorRole: ActorRole;
  eventType: EventType;
  note: string | null;
  createdAt: string;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  created: "Refund Requested",
  organizer_responded: "Organizer Responded",
  approved: "Refund Approved",
  denied: "Request Denied",
  payment_initiated: "Refund Payment Started",
  completed: "Refund Completed",
  escalated: "Escalated to Dispute",
};

const ACTOR_ROLE_LABELS: Record<ActorRole, string> = {
  buyer: "Buyer",
  organizer: "Organiser",
  admin: "WeFetePass Admin",
  system: "System",
};

const ACTOR_ROLE_COLORS: Record<ActorRole, string> = {
  buyer: "bg-blue-100 text-blue-800",
  organizer: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
  system: "bg-zinc-100 text-zinc-600",
};

const ACTOR_ROLE_DOT: Record<ActorRole, string> = {
  buyer: "bg-blue-500",
  organizer: "bg-purple-500",
  admin: "bg-red-500",
  system: "bg-zinc-400",
};

function EventIcon({ eventType }: { eventType: EventType }) {
  const cls = "h-4 w-4";
  switch (eventType) {
    case "created":
      return <FileText className={cls} aria-hidden />;
    case "organizer_responded":
      return <MessageSquare className={cls} aria-hidden />;
    case "approved":
      return <CheckCircle2 className={cls} aria-hidden />;
    case "denied":
      return <XCircle className={cls} aria-hidden />;
    case "payment_initiated":
      return <CreditCard className={cls} aria-hidden />;
    case "completed":
      return <CheckCircle2 className={cls} aria-hidden />;
    case "escalated":
      return <AlertTriangle className={cls} aria-hidden />;
    default:
      return <Clock className={cls} aria-hidden />;
  }
}

export function RefundTimeline({ events }: { events: RefundTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No timeline events yet.</p>
    );
  }

  return (
    <ol aria-label="Refund timeline" className="relative space-y-0">
      {events.map((ev, idx) => {
        const isLast = idx === events.length - 1;
        const actorRole = ev.actorRole as ActorRole;
        const eventType = ev.eventType as EventType;

        return (
          <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div
                aria-hidden
                className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
              />
            )}

            {/* Node dot */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm",
                ACTOR_ROLE_DOT[actorRole],
              )}
              aria-hidden
            >
              <span className="text-white">
                <EventIcon eventType={eventType} />
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">
                  {EVENT_TYPE_LABELS[eventType] ?? eventType}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    ACTOR_ROLE_COLORS[actorRole],
                  )}
                >
                  {ACTOR_ROLE_LABELS[actorRole] ?? actorRole}
                </span>
              </div>
              {ev.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{ev.note}</p>
              ) : null}
              <time
                dateTime={ev.createdAt}
                className="mt-1 block text-xs text-muted-foreground"
              >
                {formatDateTime(ev.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
