import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { getCurrentPromoter } from "../../_lib/queries";

export const metadata = { title: "Broadcast Detail — WeFetePass" };

const channelLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  both: "WhatsApp + SMS",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BroadcastDetailPage({ params }: PageProps) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();
  const { data: broadcast } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", id)
    .eq("organizer_id", promoter.user.id)
    .maybeSingle();

  if (!broadcast) notFound();

  const { data: recipients } = await supabase
    .from("broadcast_recipients")
    .select("id, phone, buyer_name, delivered, delivered_at, error")
    .eq("broadcast_id", id)
    .order("delivered", { ascending: false });

  let eventTitle: string | null = null;
  if (broadcast.event_id) {
    const { data: ev } = await supabase
      .from("events")
      .select("title")
      .eq("id", broadcast.event_id as string)
      .maybeSingle();
    eventTitle = ev?.title ?? null;
  }

  const recipientList = recipients ?? [];
  const deliveredCount = recipientList.filter((r) => r.delivered).length;
  const failedCount = recipientList.filter((r) => !r.delivered && r.error).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/dashboard/broadcasts">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Broadcasts
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Broadcast Detail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {formatDateTime(broadcast.created_at as string)}
          </p>
        </div>
        <Badge
          variant={broadcast.status === "sent" ? "default" : broadcast.status === "failed" ? "destructive" : "secondary"}
          className="h-fit text-sm capitalize"
        >
          {broadcast.status === "sent" && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
          {broadcast.status === "scheduled" && <Clock className="mr-1.5 h-3.5 w-3.5" />}
          {broadcast.status as string}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: message + recipients */}
        <div className="space-y-6">
          {/* Message body */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Message</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed font-sans">
                {broadcast.body as string}
              </pre>
            </CardContent>
          </Card>

          {/* Recipients */}
          {recipientList.length > 0 && (
            <Card className="border-border/60 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Recipients
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({recipientList.length} total)
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Name</th>
                      <th className="px-4 py-2.5 text-left font-medium">Phone</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium">Delivered at</th>
                      <th className="px-4 py-2.5 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipientList.map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="px-4 py-2.5 font-medium">{r.buyer_name ?? "—"}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {r.phone
                            ? r.phone.slice(0, -4).replace(/\d/g, "*") + r.phone.slice(-4)
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {r.delivered ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                              <XCircle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {r.delivered_at ? formatDateTime(r.delivered_at as string) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-destructive max-w-xs truncate">
                          {r.error ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right: stats */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium text-right">{eventTitle ?? "All events"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium">
                  {channelLabel[broadcast.channel as string] ?? broadcast.channel as string}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audience</span>
                <span className="font-medium tabular-nums">
                  {broadcast.recipient_count ?? 0} recipients
                </span>
              </div>

              {broadcast.status === "sent" && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-medium text-emerald-600 tabular-nums">
                      {(broadcast.sent_count as number | null) ?? deliveredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-600 tabular-nums">
                      {(broadcast.failed_count as number | null) ?? failedCount}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent at</span>
                    <span className="font-medium text-xs text-right">
                      {broadcast.sent_at ? formatDateTime(broadcast.sent_at as string) : "—"}
                    </span>
                  </div>
                </>
              )}

              {broadcast.status === "scheduled" && broadcast.scheduled_for && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled for</span>
                    <span className="font-medium text-xs text-right">
                      {formatDateTime(broadcast.scheduled_for as string)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {(broadcast.status === "draft" || broadcast.status === "scheduled") && (
            <Card className="border-border/60">
              <CardContent className="pt-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  This broadcast has not been sent yet.
                </p>
                <Button asChild variant="brand" className="w-full gap-2">
                  <Link href={`/dashboard/broadcasts/new?from=${broadcast.id}`}>
                    <Send className="h-4 w-4" />
                    Send Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
