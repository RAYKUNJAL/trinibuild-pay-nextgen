"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BroadcastComposer } from "@/components/broadcast-composer";
import { Skeleton } from "@/components/ui/skeleton";

interface Tier {
  id: string;
  name: string;
  event_id: string;
}

interface EventOption {
  id: string;
  title: string;
  tiers: Tier[];
}

export default function NewBroadcastPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events");
        const json = (await res.json()) as { events?: { id: string; title: string }[] };
        const evList = json.events ?? [];

        // Fetch tiers for each event
        const eventOptions: EventOption[] = await Promise.all(
          evList.map(async (e) => {
            try {
              const tierRes = await fetch(`/api/events/${e.id}`);
              const tierJson = (await tierRes.json()) as {
                event?: { ticket_tiers?: Tier[] };
              };
              const tiers = (tierJson.event?.ticket_tiers ?? []).map((t) => ({
                id: t.id,
                name: t.name,
                event_id: e.id,
              }));
              return { id: e.id, title: e.title, tiers };
            } catch {
              return { id: e.id, title: e.title, tiers: [] };
            }
          }),
        );

        setEvents(eventOptions);
        if (eventOptions[0]) setSelectedEventId(eventOptions[0].id);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            New Broadcast
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose and send a message to your ticket buyers.
          </p>
        </div>
        {events.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="event-select" className="text-sm font-medium">
              Event:
            </label>
            <select
              id="event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <BroadcastComposer
        eventId={selectedEventId || undefined}
        tiers={selectedEvent?.tiers ?? []}
        onSave={() => {
          router.push("/dashboard/broadcasts");
        }}
      />
    </div>
  );
}
