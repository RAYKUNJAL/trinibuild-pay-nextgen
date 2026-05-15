import Link from "next/link";
import { Plus, Clock, CheckCircle2, AlertCircle, FileText, MessageSquare } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { getCurrentPromoter } from "../_lib/queries";
import { PageHeader } from "../_components/page-header";

export const metadata = { title: "Broadcasts — WeFetePass" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "outline" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  sending: { label: "Sending…", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

const channelLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  both: "WA + SMS",
};

interface BroadcastRow {
  id: string;
  event_id: string | null;
  channel: string;
  status: string;
  recipient_count: number | null;
  sent_count: number | null;
  failed_count: number | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  body: string;
  subject: string | null;
}

export default async function BroadcastsPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();
  const { data: broadcasts } = await raw(supabase)
    .from("broadcasts")
    .select(
      "id, event_id, channel, status, recipient_count, sent_count, failed_count, scheduled_for, sent_at, created_at, body, subject",
    )
    .eq("organizer_id", promoter.user.id)
    .order("created_at", { ascending: false });

  // Fetch event titles for display
  const list = (broadcasts ?? []) as BroadcastRow[];
  const eventIds = [...new Set(list.map((b) => b.event_id).filter(Boolean))] as string[];
  const eventTitleMap = new Map<string, string>();
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title")
      .in("id", eventIds);
    for (const e of events ?? []) {
      eventTitleMap.set(e.id, e.title);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcasts"
        description="Send WhatsApp and SMS messages to your ticket buyers."
        actions={
          <Button asChild variant="brand">
            <Link href="/dashboard/broadcasts/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              New Broadcast
            </Link>
          </Button>
        }
      />

      {list.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No broadcasts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send your first WhatsApp or SMS message to your ticket buyers.
          </p>
          <Button asChild variant="brand" className="mt-4">
            <Link href="/dashboard/broadcasts/new">Create broadcast</Link>
          </Button>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Message</th>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Audience</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => {
                  const cfg = statusConfig[b.status] ?? statusConfig.draft;
                  return (
                    <tr key={b.id} className="border-t border-border/60 hover:bg-muted/20">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate font-medium">
                          {b.subject ?? b.body.slice(0, 50) + (b.body.length > 50 ? "…" : "")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.event_id ? (eventTitleMap.get(b.event_id) ?? "—") : "All events"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {channelLabel[b.channel] ?? b.channel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium">{b.recipient_count ?? 0}</span>
                        {b.status === "sent" && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({b.sent_count ?? 0} sent
                            {(b.failed_count ?? 0) > 0 ? `, ${b.failed_count} failed` : ""})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant} className="flex w-fit items-center gap-1 text-xs capitalize">
                          {b.status === "sent" && <CheckCircle2 className="h-3 w-3" />}
                          {b.status === "scheduled" && <Clock className="h-3 w-3" />}
                          {b.status === "failed" && <AlertCircle className="h-3 w-3" />}
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.sent_at
                          ? formatDateTime(b.sent_at)
                          : b.scheduled_for
                            ? formatDateTime(b.scheduled_for)
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/broadcasts/${b.id}`}>
                            <FileText className="mr-1 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
