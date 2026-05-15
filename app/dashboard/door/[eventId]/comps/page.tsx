"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gift, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
}

type CompReason = "artist" | "sponsor" | "press" | "staff" | "promoter_guest" | "other";

const REASON_LABELS: Record<CompReason, string> = {
  artist: "Artist",
  sponsor: "Sponsor",
  press: "Press",
  staff: "Staff",
  promoter_guest: "Promoter Guest",
  other: "Other",
};

interface CompRow {
  id: string;
  holder_name: string;
  holder_phone: string | null;
  reason: CompReason;
  issued_at: string;
  tier_id: string;
  pass_id: string | null;
  notes: string | null;
}

export default function CompsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [comps, setComps] = useState<CompRow[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTierId, setFormTierId] = useState("");
  const [formReason, setFormReason] = useState<CompReason>("other");
  const [formNotes, setFormNotes] = useState("");

  async function loadData() {
    try {
      const evRes = await fetch(`/api/events/${eventId}`);
      const evJson = (await evRes.json()) as {
        event?: {
          title: string;
          capacity: number | null;
          ticket_tiers?: Tier[];
        };
      };
      setEventTitle(evJson.event?.title ?? "Event");
      setCapacity(evJson.event?.capacity ?? null);
      const tierList = (evJson.event?.ticket_tiers ?? []).map((t) => ({
        id: t.id,
        name: t.name,
      }));
      setTiers(tierList);
      if (tierList[0]) setFormTierId(tierList[0].id);

      const compsRes = await fetch(`/api/door/${eventId}/comps`);
      const compsJson = (await compsRes.json()) as { comps?: CompRow[] };
      setComps(compsJson.comps ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [eventId]);

  function handleIssueComp(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { toast.error("Name is required"); return; }
    if (!formTierId) { toast.error("Please select a tier"); return; }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/door/${eventId}/comps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holderName: formName.trim(),
            holderPhone: formPhone.trim() || undefined,
            tierId: formTierId,
            reason: formReason,
            notes: formNotes.trim() || undefined,
          }),
        });
        const json = (await res.json()) as { passId?: string; code?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to issue comp");
        toast.success(`Comp issued: ${formName} — code ${json.code}`);
        setDialogOpen(false);
        setFormName("");
        setFormPhone("");
        setFormNotes("");
        setFormReason("other");
        await loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to issue comp");
      }
    });
  }

  function getTierName(tierId: string): string {
    return tiers.find((t) => t.id === tierId)?.name ?? tierId.slice(0, 8);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href={`/dashboard/door/${eventId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Door
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold tracking-tight">Comp Tickets</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{eventTitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="brand" className="gap-2">
              <Plus className="h-4 w-4" />
              Issue Comp
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Issue Complimentary Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIssueComp} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">Full Name *</Label>
                <Input
                  id="comp-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Trinidadian Guest"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-phone">Phone</Label>
                <Input
                  id="comp-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1868..."
                  type="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-tier">Tier *</Label>
                <Select value={formTierId} onValueChange={setFormTierId}>
                  <SelectTrigger id="comp-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-reason">Reason *</Label>
                <Select
                  value={formReason}
                  onValueChange={(v) => setFormReason(v as CompReason)}
                >
                  <SelectTrigger id="comp-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REASON_LABELS) as [CompReason, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-notes">Notes</Label>
                <Input
                  id="comp-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="brand" disabled={isPending} className="flex-1">
                  {isPending ? "Issuing…" : "Issue Comp"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Running total */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comps Issued
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{comps.length}</p>
          </CardContent>
        </Card>
        {capacity !== null && (
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comps vs. Capacity
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">
                {Math.round((comps.length / capacity) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {comps.length} of {capacity}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comps list */}
      {comps.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <Gift className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No comps issued yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue complimentary tickets for artists, sponsors, press, and staff.
          </p>
          <Button
            variant="brand"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Issue First Comp
          </Button>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Holder</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                  <th className="px-4 py-3 text-left font-medium">Issued</th>
                  <th className="px-4 py-3 text-left font-medium">Pass</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((comp) => (
                  <tr key={comp.id} className="border-t border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{comp.holder_name}</p>
                      {comp.holder_phone && (
                        <p className="text-xs text-muted-foreground">{comp.holder_phone}</p>
                      )}
                      {comp.notes && (
                        <p className="text-xs text-muted-foreground italic">{comp.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {getTierName(comp.tier_id)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {REASON_LABELS[comp.reason] ?? comp.reason}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(comp.issued_at)}
                    </td>
                    <td className="px-4 py-3">
                      {comp.pass_id ? (
                        <Link
                          href={`/passes/${comp.pass_id}`}
                          className="text-xs text-brand-red underline hover:no-underline"
                        >
                          View Pass
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
