"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestListRow } from "@/components/guest-list-row";
import { ArrowLeft, UserPlus, Download, Users } from "lucide-react";

interface Tier {
  id: string;
  name: string;
}

interface GuestEntry {
  id: string;
  name: string;
  phone: string | null;
  tierName: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  notes: string | null;
  tier_id: string | null;
}

interface RawEntry {
  id: string;
  name: string;
  phone: string | null;
  tier_id: string | null;
  notes: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
}

export default function GuestListPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addTierId, setAddTierId] = useState("none");
  const [addNotes, setAddNotes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  async function loadData() {
    try {
      // Fetch event + tiers
      const evRes = await fetch(`/api/events/${eventId}`);
      const evJson = (await evRes.json()) as {
        event?: { title: string; ticket_tiers?: Tier[] };
      };
      setEventTitle(evJson.event?.title ?? "Event");
      const tierList = (evJson.event?.ticket_tiers ?? []).map((t) => ({
        id: t.id,
        name: t.name,
      }));
      setTiers(tierList);

      // Fetch guest list entries
      const glRes = await fetch(`/api/door/${eventId}/guestlist`);
      const glJson = (await glRes.json()) as { entries?: RawEntry[] };
      const rawEntries = glJson.entries ?? [];
      const tierMap = new Map(tierList.map((t) => [t.id, t.name]));

      setEntries(
        rawEntries.map((e) => ({
          id: e.id,
          name: e.name,
          phone: e.phone,
          tier_id: e.tier_id,
          tierName: e.tier_id ? (tierMap.get(e.tier_id) ?? null) : null,
          checkedIn: e.checked_in,
          checkedInAt: e.checked_in_at,
          notes: e.notes,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [eventId]);

  function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/door/${eventId}/guestlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: addName.trim(),
            phone: addPhone.trim() || null,
            tierId: addTierId !== "none" ? addTierId : null,
            notes: addNotes.trim() || null,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to add entry");
        toast.success(`${addName} added to guest list`);
        setAddName("");
        setAddPhone("");
        setAddTierId("none");
        setAddNotes("");
        setShowAddForm(false);
        await loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add entry");
      }
    });
  }

  function handleExportCSV() {
    const header = ["Name", "Phone", "Tier", "Checked In", "Check-in Time", "Notes"];
    const rows = entries.map((e) => [
      e.name,
      e.phone ?? "",
      e.tierName ?? "",
      e.checkedIn ? "Yes" : "No",
      e.checkedInAt ?? "",
      e.notes ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guestlist-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const checkedInCount = entries.filter((e) => e.checkedIn).length;

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
          <h1 className="font-display text-2xl font-bold tracking-tight">Guest List</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {eventTitle} · {checkedInCount} / {entries.length} checked in
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowAddForm((v) => !v)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-brand-red/30 bg-brand-red/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Guest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEntry} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+1868..."
                  type="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-tier">Tier</Label>
                <Select value={addTierId} onValueChange={setAddTierId}>
                  <SelectTrigger id="add-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tier</SelectItem>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-notes">Notes</Label>
                <Input
                  id="add-notes"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="VIP, dietary, etc."
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <Button type="submit" variant="brand" disabled={isPending} size="sm">
                  {isPending ? "Adding…" : "Add to List"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guest list table */}
      {entries.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">Guest list is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Add guests manually or import from a CSV.</p>
          <Button variant="brand" size="sm" className="mt-4 gap-2" onClick={() => setShowAddForm(true)}>
            <UserPlus className="h-4 w-4" />
            Add First Guest
          </Button>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <GuestListRow key={entry.id} entry={entry} eventId={eventId} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
