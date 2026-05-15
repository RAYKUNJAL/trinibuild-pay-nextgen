"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Props {
  eventId: string;
}

type CheckinResult = "checked_in" | "not_found" | "already_in" | null;

interface RecentEntry {
  query: string;
  result: CheckinResult;
  holderName?: string;
  entryType?: string;
  time: string;
}

const resultConfig: Record<
  NonNullable<CheckinResult>,
  { label: string; color: string; icon: React.ElementType; bg: string }
> = {
  checked_in: {
    label: "CHECKED IN",
    color: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  },
  already_in: {
    label: "ALREADY IN",
    color: "text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  },
  not_found: {
    label: "NOT FOUND",
    color: "text-red-700 dark:text-red-400",
    icon: XCircle,
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  },
};

export function DoorCheckinCard({ eventId }: Props) {
  const [query, setQuery] = useState("");
  const [lastResult, setLastResult] = useState<CheckinResult>(null);
  const [lastHolderName, setLastHolderName] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleClear() {
    setQuery("");
    setLastResult(null);
    setLastHolderName(null);
    inputRef.current?.focus();
  }

  function triggerAutoClear() {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setLastResult(null);
      setLastHolderName(null);
      setQuery("");
      inputRef.current?.focus();
    }, 2000);
  }

  async function performCheckin(searchQuery: string) {
    if (!searchQuery.trim()) return;

    const trimmed = searchQuery.trim();
    // Determine if it looks like a pass code (6 chars alphanumeric), phone, or name
    const isPassCode = /^[A-Z0-9]{5,8}$/i.test(trimmed.replace(/\s/g, ""));
    const isPhone = /^\+?[0-9]{7,15}$/.test(trimmed.replace(/\s/g, ""));

    const payload: Record<string, string> = {};
    if (isPassCode) {
      payload.passCode = trimmed.toUpperCase();
    } else if (isPhone) {
      payload.phone = trimmed;
    } else {
      payload.name = trimmed;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/door/${eventId}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as {
          result?: CheckinResult;
          entryType?: string;
          holderName?: string;
          error?: string;
        };

        if (!res.ok) throw new Error(json.error ?? "Check-in failed");

        const result = json.result ?? "not_found";
        setLastResult(result);
        setLastHolderName(json.holderName ?? null);

        const now = new Date().toLocaleTimeString("en-TT", { hour: "2-digit", minute: "2-digit" });
        setRecentEntries((prev) =>
          [
            {
              query: trimmed,
              result,
              holderName: json.holderName,
              entryType: json.entryType,
              time: now,
            },
            ...prev,
          ].slice(0, 10),
        );

        if (result === "checked_in") {
          toast.success(`Checked in: ${json.holderName ?? trimmed}`);
        } else if (result === "already_in") {
          toast.warning(`Already checked in: ${json.holderName ?? trimmed}`);
        } else {
          toast.error(`Not found: ${trimmed}`);
        }

        triggerAutoClear();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Check-in failed");
        setLastResult("not_found");
        triggerAutoClear();
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void performCheckin(query);
  }

  const cfg = lastResult ? resultConfig[lastResult] : null;

  return (
    <div className="space-y-4">
      {/* Result flash */}
      {cfg && (
        <div
          className={cn(
            "rounded-xl border-2 p-6 text-center transition-all",
            cfg.bg,
          )}
        >
          <cfg.icon className={cn("mx-auto h-12 w-12", cfg.color)} aria-hidden />
          <p className={cn("mt-2 text-2xl font-black tracking-widest", cfg.color)}>
            {cfg.label}
          </p>
          {lastHolderName && (
            <p className="mt-1 text-base font-semibold text-foreground">{lastHolderName}</p>
          )}
        </div>
      )}

      {/* Search form */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manual Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pass code, phone, or name…"
                className="pl-9 font-mono uppercase"
                autoComplete="off"
                autoCapitalize="characters"
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              disabled={isPending || !query.trim()}
            >
              {isPending ? "…" : "Check In"}
            </Button>
            {query && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isPending}
              >
                Clear
              </Button>
            )}
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Enter a pass code (e.g. AB12CD), phone number, or attendee name
          </p>
        </CardContent>
      </Card>

      {/* Recent check-ins */}
      {recentEntries.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Recent</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {recentEntries.map((entry, i) => {
                const entryCfg = entry.result ? resultConfig[entry.result] : null;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {entry.holderName ?? entry.query}
                      </p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
                    {entryCfg && (
                      <Badge
                        className={cn(
                          "ml-2 shrink-0 text-xs font-bold",
                          entry.result === "checked_in" &&
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                          entry.result === "already_in" &&
                            "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                          entry.result === "not_found" &&
                            "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                        )}
                      >
                        {entryCfg.label}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
