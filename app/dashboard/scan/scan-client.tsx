"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QrScanner } from "@/components/qr-scanner";
import { cn } from "@/lib/utils";

export type ScanEventOption = {
  id: string;
  title: string;
  issued: number;
  scanned: number;
};

type Result = "valid" | "duplicate" | "invalid" | "wrong_event" | "cached";

type RecentScan = {
  id: string;
  result: Result;
  at: string;
  holder?: string | null;
  tier?: string | null;
};

type OfflineScanEntry = {
  code: string;
  scannedAt: string;
};

const resultMeta: Record<Result, { label: string; icon: typeof CheckCircle2; className: string }> = {
  valid: { label: "Valid", icon: CheckCircle2, className: "text-emerald-600" },
  duplicate: { label: "Already scanned", icon: AlertTriangle, className: "text-amber-600" },
  invalid: { label: "Invalid", icon: XCircle, className: "text-brand-red" },
  wrong_event: { label: "Wrong event", icon: XCircle, className: "text-brand-red" },
  cached: { label: "CACHED — will sync when online", icon: Clock, className: "text-amber-500" },
};

function ScannerResult({ recent }: { recent: RecentScan | null }) {
  if (!recent) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Clock className="h-5 w-5" aria-hidden />
          Awaiting first scan.
        </CardContent>
      </Card>
    );
  }
  const meta = resultMeta[recent.result];
  const Icon = meta.icon;
  const isCached = recent.result === "cached";
  return (
    <Card
      className={cn(
        "border-border/60",
        isCached && "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/30",
      )}
    >
      <CardContent className="flex items-center gap-3 p-6">
        <Icon className={cn("h-6 w-6", meta.className)} aria-hidden />
        <div>
          <p className={cn("font-display text-lg font-semibold", meta.className)}>
            {meta.label}
          </p>
          {recent.holder ? (
            <p className="text-sm text-muted-foreground">
              {recent.holder}
              {recent.tier ? ` · ${recent.tier}` : ""}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function offlineStorageKey(eventId: string) {
  return `wfp_offline_scans_${eventId}`;
}

function readOfflineScans(eventId: string): OfflineScanEntry[] {
  try {
    const raw = localStorage.getItem(offlineStorageKey(eventId));
    if (!raw) return [];
    return JSON.parse(raw) as OfflineScanEntry[];
  } catch {
    return [];
  }
}

function writeOfflineScans(eventId: string, scans: OfflineScanEntry[]): void {
  try {
    localStorage.setItem(offlineStorageKey(eventId), JSON.stringify(scans));
  } catch {
    // localStorage may be full or unavailable
  }
}

function clearOfflineScans(eventId: string): void {
  try {
    localStorage.removeItem(offlineStorageKey(eventId));
  } catch {
    // ignore
  }
}

export function ScanClient({
  events,
  initialEventId,
}: {
  events: ScanEventOption[];
  initialEventId: string | null;
}) {
  const [eventId, setEventId] = useState<string | null>(initialEventId);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Offline mode state
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const current = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  // Refresh pending count whenever eventId or offlineMode changes
  const refreshPendingCount = useCallback(() => {
    if (!eventId) {
      setPendingCount(0);
      return;
    }
    setPendingCount(readOfflineScans(eventId).length);
  }, [eventId]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  async function handleScan(decoded: string) {
    if (!eventId || verifying) return;
    setVerifying(true);
    setErrorMsg(null);

    // ── Offline path ──────────────────────────────────────────────────────────
    if (offlineMode) {
      const existing = readOfflineScans(eventId);
      existing.push({ code: decoded, scannedAt: new Date().toISOString() });
      writeOfflineScans(eventId, existing);
      setPendingCount(existing.length);

      setRecent((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random()}`,
            result: "cached" as Result,
            at: new Date().toISOString(),
            holder: null,
            tier: null,
          },
          ...prev,
        ].slice(0, 10),
      );
      setVerifying(false);
      return;
    }

    // ── Online path (unchanged) ───────────────────────────────────────────────
    try {
      const res = await fetch("/api/passes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decoded, eventId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        result?: Result;
        holder?: string | null;
        tier?: string | null;
        error?: string;
      };
      if (!res.ok || !body.result) {
        setErrorMsg(body.error ?? "Verification failed");
        return;
      }
      setRecent((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random()}`,
            result: body.result!,
            at: new Date().toISOString(),
            holder: body.holder,
            tier: body.tier,
          },
          ...prev,
        ].slice(0, 10),
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleSyncNow() {
    if (!eventId || syncing) return;
    const offline = readOfflineScans(eventId);
    if (offline.length === 0) {
      toast.info("No offline scans to sync.");
      return;
    }

    setSyncing(true);
    const results: RecentScan[] = [];

    for (const entry of offline) {
      try {
        const res = await fetch("/api/passes/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: entry.code, eventId }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          result?: Result;
          holder?: string | null;
          tier?: string | null;
        };
        results.push({
          id: `${Date.now()}-${Math.random()}`,
          result: body.result ?? "invalid",
          at: entry.scannedAt,
          holder: body.holder ?? null,
          tier: body.tier ?? null,
        });
      } catch (err) {
        console.error("[sync-offline]", err);
        results.push({
          id: `${Date.now()}-${Math.random()}`,
          result: "invalid",
          at: entry.scannedAt,
        });
      }
    }

    clearOfflineScans(eventId);
    setPendingCount(0);

    setRecent((prev) => [...results.reverse(), ...prev].slice(0, 20));

    const validCount = results.filter((r) => r.result === "valid").length;
    toast.success(
      `Synced ${results.length} scan${results.length !== 1 ? "s" : ""} — ${validCount} valid`,
    );
    setSyncing(false);
  }

  function handleOfflineToggle() {
    setOfflineMode((prev) => !prev);
    setErrorMsg(null);
  }

  const mostRecent = recent[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header row: event picker + mode indicator + controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-sm">
          <Label>Scanning for</Label>
          <Select value={eventId ?? undefined} onValueChange={(v) => setEventId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          {/* Online / Offline status indicator */}
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              offlineMode
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
            )}
          >
            {offlineMode ? (
              <>
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
                Offline Mode
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5" aria-hidden />
                Online
              </>
            )}
          </span>

          {/* Offline mode toggle */}
          <button
            type="button"
            onClick={handleOfflineToggle}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              offlineMode
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "border border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            Offline Mode
            {pendingCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>

          {/* Sync button — only visible when there are queued offline scans */}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => void handleSyncNow()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} aria-hidden />
              {syncing ? "Syncing…" : `Sync Now (${pendingCount})`}
            </button>
          )}
        </div>

        {current ? (
          <div className="text-right">
            <p className="font-display text-2xl font-bold">
              {current.scanned} / {current.issued}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Scanned
            </p>
          </div>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Create an event first to scan tickets.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <QrScanner
                onScan={(d) => void handleScan(d)}
                onError={(e) => setErrorMsg(e)}
                paused={verifying || !eventId}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <ScannerResult recent={mostRecent} />
            {errorMsg ? (
              <p className="text-sm text-brand-red">{errorMsg}</p>
            ) : null}

            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent scans
                </div>
                {recent.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Recent scans will appear here.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recent.map((r) => {
                      const meta = resultMeta[r.result];
                      const Icon = meta.icon;
                      return (
                        <li
                          key={r.id}
                          className={cn(
                            "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                            r.result === "cached" &&
                              "bg-amber-50/50 dark:bg-amber-950/20",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", meta.className)} aria-hidden />
                            <span className={cn("font-medium", meta.className)}>
                              {meta.label}
                            </span>
                            {r.holder ? (
                              <span className="text-muted-foreground">— {r.holder}</span>
                            ) : null}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.at).toLocaleTimeString("en-TT")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
