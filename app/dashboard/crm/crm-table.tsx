"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTTD, formatDateTime } from "@/lib/utils";

export type CrmRow = {
  key: string;
  name: string;
  phone: string | null;
  last_event_title: string;
  last_event_at: string;
  total_cents: number;
  ticket_count: number;
};

export function CrmTable({ rows }: { rows: CrmRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <span>
          {selected.size > 0 ? `${selected.size} selected` : `${rows.length} buyers`}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={selected.size === 0}
          onClick={() => setDialogOpen(true)}
        >
          Message segment
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Last event</th>
              <th className="px-4 py-3 text-left font-medium">Tickets</th>
              <th className="px-4 py-3 text-left font-medium">Spent</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const waLink = r.phone
                ? `https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hey from WeFetePass —")}`
                : null;
              return (
                <tr key={r.key} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.name}`}
                      checked={selected.has(r.key)}
                      onChange={() => toggle(r.key)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{r.last_event_title}</div>
                    <div className="text-xs">{formatDateTime(r.last_event_at)}</div>
                  </td>
                  <td className="px-4 py-3">{r.ticket_count}</td>
                  <td className="px-4 py-3">{formatTTD(r.total_cents)}</td>
                  <td className="px-4 py-3 text-right">
                    {waLink ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={waLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />
                          Message
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No phone</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk WhatsApp coming soon</DialogTitle>
            <DialogDescription>
              We&apos;re building broadcast tools that respect WhatsApp&apos;s 24-hour window
              and opt-in rules. For now, message buyers one-by-one from the table.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
