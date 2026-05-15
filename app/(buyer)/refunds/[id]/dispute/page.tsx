import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  DisputeStatusCard,
} from "@/components/dispute-status-card";
import { formatDateTime } from "@/lib/utils";
import { MessageForm } from "./_message-form";

export const metadata: Metadata = { title: "Dispute — WeFetePass" };

type Params = { id: string };

type DisputeStatus =
  | "open"
  | "organizer_responded"
  | "under_review"
  | "resolved_buyer"
  | "resolved_organizer"
  | "closed";

type Dispute = {
  id: string;
  status: DisputeStatus;
  summary: string;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

export default async function DisputePage({
  params,
}: {
  params: Promise<Params>;
}) {
  // Note: `id` here is the refund id from the URL /refunds/[id]/dispute
  const { id: refundId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch refund to verify ownership
  const { data: refundData } = await supabase
    .from("refund_requests")
    .select("id, buyer_id")
    .eq("id", refundId)
    .maybeSingle();

  const refundOwner = refundData as { id: string; buyer_id: string } | null;
  if (!refundOwner || refundOwner.buyer_id !== user.id) notFound();

  // Fetch the dispute linked to this refund
  const { data: disputeData } = await supabase
    .from("disputes")
    .select(
      "id, status, summary, resolution_note, created_at, resolved_at",
    )
    .eq("refund_id", refundId)
    .maybeSingle();

  const dispute = disputeData as unknown as Dispute | null;
  if (!dispute) {
    notFound();
  }

  // Fetch messages
  const { data: messagesData } = await supabase
    .from("dispute_messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("dispute_id", dispute.id)
    .order("created_at", { ascending: true });

  const messages = (messagesData ?? []) as Message[];
  const isResolved = ["resolved_buyer", "resolved_organizer", "closed"].includes(
    dispute.status,
  );

  return (
    <>
      <PageHeader
        title="Dispute"
        description={`Refund escalation · ${formatDateTime(dispute.created_at)}`}
      />

      <div className="mt-6 space-y-6">
        <DisputeStatusCard
          dispute={{
            id: dispute.id,
            status: dispute.status,
            summary: dispute.summary,
            createdAt: dispute.created_at,
            resolvedAt: dispute.resolved_at,
            resolutionNote: dispute.resolution_note,
          }}
        />

        {/* Message thread */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display text-lg font-semibold mb-4">
              Messages
            </h2>

            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              <ul className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <li
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm rounded-xl px-4 py-3 text-sm ${
                          isMe
                            ? "bg-brand-red text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-75 capitalize">
                          {isMe ? "You" : msg.sender_role}
                        </p>
                        <p>{msg.body}</p>
                        <time
                          dateTime={msg.created_at}
                          className="mt-1 block text-xs opacity-60"
                        >
                          {formatDateTime(msg.created_at)}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {!isResolved ? (
              <>
                <Separator className="my-4" />
                <MessageForm disputeId={dispute.id} />
              </>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
                This dispute has been resolved and the thread is now closed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
