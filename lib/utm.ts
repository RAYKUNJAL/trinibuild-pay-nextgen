export type UTMParams = {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
};

export type CampaignLinkConfig = {
  baseUrl: string;
  eventSlug: string;
  utmParams: UTMParams;
};

/**
 * Appends UTM query params to baseUrl. Handles existing query strings correctly.
 */
export function buildCampaignUrl(config: CampaignLinkConfig): string {
  const { baseUrl, utmParams } = config;

  const params = new URLSearchParams();
  params.set("utm_source", utmParams.source);
  params.set("utm_medium", utmParams.medium);
  params.set("utm_campaign", utmParams.campaign);
  if (utmParams.content) params.set("utm_content", utmParams.content);
  if (utmParams.term) params.set("utm_term", utmParams.term);

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * Parses UTM params from a URL string. Returns null if utm_source, utm_medium,
 * or utm_campaign are missing.
 */
export function parseCampaignUrl(url: string): UTMParams | null {
  try {
    const parsed = new URL(url);
    const source = parsed.searchParams.get("utm_source");
    const medium = parsed.searchParams.get("utm_medium");
    const campaign = parsed.searchParams.get("utm_campaign");

    if (!source || !medium || !campaign) return null;

    const result: UTMParams = { source, medium, campaign };
    const content = parsed.searchParams.get("utm_content");
    const term = parsed.searchParams.get("utm_term");
    if (content) result.content = content;
    if (term) result.term = term;

    return result;
  } catch {
    return null;
  }
}

/**
 * Generates a URL-safe slug from a name plus a random 4-char suffix,
 * totalling 8 characters max.
 */
export function generateCampaignSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 4);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`.slice(0, 8);
}

/**
 * Returns a conversion rate percentage string like "12.3%".
 */
export function computeConversionRate(clicks: number, conversions: number): string {
  if (clicks === 0) return "0.0%";
  return `${((conversions / clicks) * 100).toFixed(1)}%`;
}

/**
 * Estimates revenue in cents from a campaign based on conversion count and
 * average order value.
 */
export function estimateRevenueFromCampaign(
  conversionCount: number,
  avgOrderCents: number,
): number {
  return Math.round(conversionCount * avgOrderCents);
}
