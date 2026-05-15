import Link from "next/link";
import { Plus, TrendingUp, MousePointerClick, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatTTD } from "@/lib/utils";
import { CampaignLinkCard } from "@/components/campaign-link-card";
import { PageHeader } from "../../_components/page-header";
import { getCurrentPromoter } from "../../_lib/queries";

export const metadata = { title: "Campaign Links — WeFetePass" };

export default async function CampaignsPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const supabase = await createClient();

  const { data: rawCampaigns } = await supabase
    .from("campaign_links")
    .select(
      "id, name, campaign_type, full_url, click_count, conversion_count, revenue_cents, active, created_at",
    )
    .eq("organizer_id", promoter.user.id)
    .order("created_at", { ascending: false });

  const campaigns = rawCampaigns ?? [];

  const totalClicks = campaigns.reduce((sum, c) => sum + c.click_count, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversion_count, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue_cents, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Links"
        description="Track UTM links across promoters, influencers, and channels."
        actions={
          <Button asChild size="sm">
            <Link href="/dashboard/crm/campaigns/new" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              New Campaign
            </Link>
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <MousePointerClick className="h-4 w-4 text-blue-600" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-lg bg-green-50 p-2">
              <ShoppingBag className="h-4 w-4 text-green-600" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalConversions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Conversions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="rounded-lg bg-amber-50 p-2">
              <TrendingUp className="h-4 w-4 text-amber-600" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatTTD(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Attributed Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign cards */}
      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
          <p className="font-medium text-sm">No campaign links yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create UTM links to track where your ticket sales come from.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/crm/campaigns/new">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden />
              Create your first campaign
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignLinkCard
              key={c.id}
              campaign={{
                id: c.id,
                name: c.name,
                campaignType: c.campaign_type as
                  | "street_team"
                  | "influencer"
                  | "social"
                  | "email"
                  | "whatsapp"
                  | "other",
                fullUrl: c.full_url,
                clickCount: c.click_count,
                conversionCount: c.conversion_count,
                revenueCents: c.revenue_cents,
                active: c.active,
                createdAt: c.created_at,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
