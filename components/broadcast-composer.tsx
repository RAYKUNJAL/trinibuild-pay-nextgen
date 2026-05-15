"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { Send, Save, Clock, Users, MessageSquare } from "lucide-react";

const WA_CHAR_LIMIT = 1600;

interface Tier {
  id: string;
  name: string;
}

interface BroadcastDraft {
  eventId?: string;
  tierIds: string[];
  body: string;
  channel: "whatsapp" | "sms" | "both";
  scheduledFor?: string;
}

interface Props {
  eventId?: string;
  tiers: Tier[];
  onSave: (draft: BroadcastDraft) => void;
}

function highlightMergeFields(text: string): React.ReactNode {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{[^}]+\}\}$/.test(part) ? (
      <mark key={i} className="rounded bg-brand-red/20 px-0.5 text-brand-red font-mono text-xs">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function BroadcastComposer({ eventId, tiers, onSave }: Props) {
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "both">("whatsapp");
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const remaining = WA_CHAR_LIMIT - body.length;
  const isOverLimit = remaining < 0;
  const allTiers = selectedTierIds.length === 0;

  function toggleTier(id: string) {
    setSelectedTierIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSaveDraft() {
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    const draft: BroadcastDraft = {
      eventId,
      tierIds: selectedTierIds,
      body,
      channel,
      scheduledFor: scheduled && scheduledFor ? scheduledFor : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/broadcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const json = (await res.json()) as { broadcastId?: string; recipientCount?: number; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to save draft");
        setBroadcastId(json.broadcastId ?? null);
        onSave({ ...draft });
        toast.success(`Draft saved — ${json.recipientCount ?? 0} recipient${(json.recipientCount ?? 0) !== 1 ? "s" : ""}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function handleSendNow() {
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }

    startTransition(async () => {
      try {
        // If no draft saved yet, save first
        let bid = broadcastId;
        if (!bid) {
          const draft: BroadcastDraft = {
            eventId,
            tierIds: selectedTierIds,
            body,
            channel,
            scheduledFor: undefined,
          };
          const res = await fetch("/api/broadcasts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
          });
          const json = (await res.json()) as { broadcastId?: string; error?: string };
          if (!res.ok) throw new Error(json.error ?? "Failed to create broadcast");
          bid = json.broadcastId!;
          setBroadcastId(bid);
        }

        const sendRes = await fetch(`/api/broadcasts/${bid}/send`, {
          method: "POST",
        });
        const sendJson = (await sendRes.json()) as { sent?: number; failed?: number; error?: string };
        if (!sendRes.ok) throw new Error(sendJson.error ?? "Send failed");

        toast.success(
          `Broadcast sent — ${sendJson.sent ?? 0} delivered, ${sendJson.failed ?? 0} failed`,
        );
        onSave({ eventId, tierIds: selectedTierIds, body, channel });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Send failed");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left: Compose */}
      <div className="space-y-6">
        {/* Audience */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {allTiers ? "All ticket buyers" : "Selected tiers only"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTierIds([])}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  allTiers
                    ? "border-brand-red bg-brand-red/10 text-brand-red"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                All buyers
              </button>
              {tiers.map((tier) => {
                const active = selectedTierIds.includes(tier.id);
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => toggleTier(tier.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-brand-red bg-brand-red/10 text-brand-red"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {tier.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Channel */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as "whatsapp" | "sms" | "both")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Message Body */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-body">Body</Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isOverLimit ? "font-medium text-destructive" : "text-muted-foreground",
                  )}
                >
                  {remaining} chars remaining
                </span>
              </div>
              <Textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"Hey {{name}}! Big news about {{event}}..."}
                className="min-h-36 resize-y font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use{" "}
                <code className="rounded bg-muted px-1">{"{{name}}"}</code> and{" "}
                <code className="rounded bg-muted px-1">{"{{event}}"}</code> as merge fields.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Toggle
                pressed={scheduled}
                onPressedChange={setScheduled}
                aria-label="Schedule for later"
                className="data-[state=on]:bg-brand-red/10 data-[state=on]:text-brand-red"
              >
                Schedule for later
              </Toggle>
            </div>
            {scheduled && (
              <div className="space-y-1.5">
                <Label htmlFor="scheduled-for">Send at</Label>
                <input
                  id="scheduled-for"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isPending || isOverLimit}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            variant="brand"
            onClick={handleSendNow}
            disabled={isPending || isOverLimit || !body.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Sending…" : "Send Now"}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-brand-red/20 flex items-center justify-center text-xs font-bold text-brand-red">
                  WF
                </div>
                <div>
                  <p className="text-xs font-medium">WeFetePass</p>
                  <p className="text-[10px] text-muted-foreground">via {channel === "both" ? "WhatsApp + SMS" : channel === "whatsapp" ? "WhatsApp" : "SMS"}</p>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {body
                  ? highlightMergeFields(
                      body
                        .replace(/\{\{name\}\}/g, "{{name}}")
                        .replace(/\{\{event\}\}/g, "{{event}}"),
                    )
                  : (
                    <span className="text-muted-foreground italic">
                      Your message preview will appear here…
                    </span>
                  )}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Audience</p>
              <div className="flex flex-wrap gap-1">
                {allTiers ? (
                  <Badge variant="secondary" className="text-xs">All buyers</Badge>
                ) : (
                  tiers
                    .filter((t) => selectedTierIds.includes(t.id))
                    .map((t) => (
                      <Badge key={t.id} variant="secondary" className="text-xs">
                        {t.name}
                      </Badge>
                    ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Merge fields:</strong> <code className="rounded bg-muted px-1">{"{{name}}"}</code> is
              replaced with buyer name, <code className="rounded bg-muted px-1">{"{{event}}"}</code> with
              event title before sending.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
