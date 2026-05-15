import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventStatusBadge, type EventStatus } from "@/components/event-status-badge";
import { formatTTD, formatDateTime, cn } from "@/lib/utils";

export type EventCardEvent = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  venue?: string | null;
  city?: string | null;
  starts_at: string;
  cover_image_url?: string | null;
  status: EventStatus;
  priceFromCents?: number | null;
};

export function EventCard({ event }: { event: EventCardEvent }) {
  const isSoldOut = event.status === "sold_out";
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="overflow-hidden border-border/60 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 gradient-fete" aria-hidden />
          )}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {isSoldOut ? <EventStatusBadge status={event.status} /> : null}
          </div>
          {typeof event.priceFromCents === "number" ? (
            <Badge className={cn(
              "absolute left-3 bottom-3 bg-background/90 text-foreground hover:bg-background/90",
            )}>
              from {formatTTD(event.priceFromCents)}
            </Badge>
          ) : null}
        </div>
        <CardContent className="p-4">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2">
            {event.title}
          </h3>
          {event.tagline ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{event.tagline}</p>
          ) : null}
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              <span>{formatDateTime(event.starts_at)}</span>
            </div>
            {(event.venue || event.city) ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                <span className="truncate">
                  {[event.venue, event.city].filter(Boolean).join(", ")}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
