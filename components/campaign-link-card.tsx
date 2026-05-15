"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTTD } from "@/lib/utils";
import { computeConversionRate } from "@/lib/utm";

type CampaignType = "street_team" | "influencer" | "social" | "email" | "whatsapp" | "other";

type CampaignLinkCardProps = {
  campaign: {
    id: string;
    name: string;
    campaignType: CampaignType;
    fullUrl: string;
    clickCount: number;
    conversionCount: number;
    revenueCents: number;
    active: boolean;
    createdAt: string;
  };
};

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  street_team: "Street Team",
  influencer: "Influencer",
  social: "Social",
  email: "Email",
  whatsapp: "WhatsApp",
  other: "Other",
};

const CAMPAIGN_TYPE_COLORS: Record<CampaignType, string> = {
  street_team: "bg-purple-100 text-purple-800 border-purple-200",
  influencer: "bg-pink-100 text-pink-800 border-pink-200",
  social: "bg-blue-100 text-blue-800 border-blue-200",
  email: "bg-green-100 text-green-800 border-green-200",
  whatsapp: "bg-emerald-100 text-emerald-800 border-emerald-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function CampaignLinkCard({ campaign }: CampaignLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const conversionRate = computeConversionRate(campaign.clickCount, campaign.conversionCount);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(campaign.fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  const truncatedUrl =
    campaign.fullUrl.length > 60
      ? `${campaign.fullUrl.slice(0, 57)}…`
      : campaign.fullUrl;

  return (
    <Card className={cn("border-border/60 transition-opacity", !campaign.active && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-sm truncate max-w-[200px]" title={campaign.name}>
              {campaign.name}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                CAMPAIGN_TYPE_COLORS[campaign.campaignType],
              )}
            >
              {CAMPAIGN_TYPE_LABELS[campaign.campaignType]}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {campaign.active ? (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-200 text-[10px]">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL row */}
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground" title={campaign.fullUrl}>
            {truncatedUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded p-1 hover:bg-background transition-colors"
            aria-label="Copy campaign URL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            )}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums">{campaign.clickCount.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Clicks</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{conversionRate}</p>
            <p className="text-[11px] text-muted-foreground">Conv. Rate</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{formatTTD(campaign.revenueCents)}</p>
            <p className="text-[11px] text-muted-foreground">Revenue</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-[11px] text-muted-foreground">
            {campaign.conversionCount} sale{campaign.conversionCount !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/crm/campaigns/${campaign.id}`} className="flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" aria-hidden />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
