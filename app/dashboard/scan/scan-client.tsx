"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
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

type Result = "valid" | "duplicate" | "invalid" | "wrong_event";

type RecentScan = {
  id: string;
  result: Result;
  at: string;
  holder?: string | null;
  tier?: string | null;
};

const resultMeta: Record<Result, { label: string; icon: typeof CheckCircle2; className: string }> = {
  valid: { label: "Valid", icon: CheckCircle2, className: "text-emerald-600" },
  duplicate: { label: "Already scanned", icon: AlertTriangle, className: "text-amber-600" },
  invalid: { label: "Invalid", icon: XCircle, className: "text-brand-red" },
  wrong_event: { label: "Wrong event", icon: XCircle, className: "text-brand-red" },
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
  return (
    <Card className="border-border/60">
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

  const current = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId],
  );

  async function handleScan(decoded: string) {
    if (!eventId || verifying) return;
    setVerifying(true);
    setErrorMsg(null);
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

  const mostRecent = recent[0] ?? null;

  return (
    <div className="space-y-6">
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
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
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
