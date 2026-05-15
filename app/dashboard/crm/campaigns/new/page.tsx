"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCampaignUrl } from "@/lib/utm";

type CampaignType = "street_team" | "influencer" | "social" | "email" | "whatsapp" | "other";

type Event = {
  id: string;
  title: string;
  slug: string;
};

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: "street_team", label: "Street Team" },
  { value: "influencer", label: "Influencer" },
  { value: "social", label: "Social Media" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType>("social");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((json: { events?: Event[] }) => {
        setEvents(json.events ?? []);
      })
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  // Auto-populate base URL when event is selected
  useEffect(() => {
    if (!selectedEventId) return;
    const evt = events.find((e) => e.id === selectedEventId);
    if (evt) {
      const siteUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://wefetepass.com";
      setBaseUrl(`${siteUrl}/events/${evt.slug}`);
    }
  }, [selectedEventId, events]);

  // Compute live preview URL
  const previewUrl =
    utmSource && utmMedium && utmCampaign && baseUrl
      ? buildCampaignUrl({
          baseUrl,
          eventSlug: "",
          utmParams: {
            source: utmSource,
            medium: utmMedium,
            campaign: utmCampaign,
            ...(utmContent ? { content: utmContent } : {}),
          },
        })
      : null;

  async function handleCopyCreated() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !utmSource.trim() || !utmMedium.trim() || !utmCampaign.trim() || !baseUrl.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            campaignType,
            ...(selectedEventId ? { eventId: selectedEventId } : {}),
            utmSource: utmSource.trim(),
            utmMedium: utmMedium.trim(),
            utmCampaign: utmCampaign.trim(),
            ...(utmContent.trim() ? { utmContent: utmContent.trim() } : {}),
            baseUrl: baseUrl.trim(),
          }),
        });

        const json = (await response.json()) as {
          campaign?: { full_url: string };
          error?: string;
        };

        if (!response.ok) {
          toast.error(json.error ?? "Failed to create campaign");
          return;
        }

        if (json.campaign?.full_url) {
          setCreatedUrl(json.campaign.full_url);
          toast.success("Campaign link created!");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (createdUrl) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/dashboard/crm/campaigns">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Campaigns
          </Link>
        </Button>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Link Created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with your promoters, influencers, or embed in your campaigns.
            </p>

            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted px-3 py-3">
              <span className="flex-1 break-all font-mono text-xs text-muted-foreground">
                {createdUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyCreated}
                className="shrink-0 rounded p-1 hover:bg-background transition-colors"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyCreated} className="flex-1 gap-1.5">
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/crm/campaigns")}
              >
                View All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/dashboard/crm/campaigns">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold tracking-tight">New Campaign Link</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Campaign Name <span aria-hidden className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Machel Monday Street Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaignType">Type</Label>
              <Select
                value={campaignType}
                onValueChange={(v) => setCampaignType(v as CampaignType)}
              >
                <SelectTrigger id="campaignType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event">Event (optional)</Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={eventsLoading}
              >
                <SelectTrigger id="event">
                  <SelectValue placeholder={eventsLoading ? "Loading events…" : "No specific event"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific event</SelectItem>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">UTM Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="utmSource">
                  Source <span aria-hidden className="text-destructive">*</span>
                </Label>
                <Input
                  id="utmSource"
                  placeholder="e.g. instagram"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utmMedium">
                  Medium <span aria-hidden className="text-destructive">*</span>
                </Label>
                <Input
                  id="utmMedium"
                  placeholder="e.g. social"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="utmCampaign">
                Campaign <span aria-hidden className="text-destructive">*</span>
              </Label>
              <Input
                id="utmCampaign"
                placeholder="e.g. carnival2026-launch"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="utmContent">Content (optional)</Label>
              <Input
                id="utmContent"
                placeholder="e.g. story-link or bio-link"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">
                Base URL <span aria-hidden className="text-destructive">*</span>
              </Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://wefetepass.com/events/your-event"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Selecting an event above will auto-fill this field.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        {previewUrl && (
          <Card className="border-border/60 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Preview URL
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3">
              <p className="break-all font-mono text-xs text-foreground leading-relaxed">
                {previewUrl}
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating…" : "Create Campaign Link"}
        </Button>
      </form>
    </div>
  );
}
