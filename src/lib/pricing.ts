// Pricing reflects the master strategy (TTD-denominated, USD equivalents shown).
// Source of truth for marketing page, dashboard, and billing.

export type Tier = {
  id: "API_LICENSING" | "WHITE_LABEL" | "ENTERPRISE";
  name: string;
  tagline: string;
  setupFeeTTD: number;
  monthlyFeeTTD: number;
  perVerificationTTD: number;
  revenueSharePercent?: number;
  features: string[];
  bestFor: string;
  ctaLabel: string;
};

export const TIERS: Tier[] = [
  {
    id: "API_LICENSING",
    name: "API Licensing",
    tagline: "Drop-in bank verification API. 30 minutes to integrate.",
    setupFeeTTD: 5_000,
    monthlyFeeTTD: 1_000,
    perVerificationTTD: 15,
    features: [
      "REST API + webhooks",
      "SDKs (TypeScript, Python, Go)",
      "Standard SLA — 99.5% uptime",
      "Email support",
      "Sandbox + live keys",
      "Per-verification metering",
    ],
    bestFor: "Fintech apps, e-commerce, ticketing, bill aggregators",
    ctaLabel: "Start free trial",
  },
  {
    id: "WHITE_LABEL",
    name: "White-Label Platform",
    tagline: "Full merchant dashboard + consumer app under your brand.",
    setupFeeTTD: 25_000,
    monthlyFeeTTD: 15_000,
    perVerificationTTD: 10,
    revenueSharePercent: 0.25,
    features: [
      "White-labeled merchant dashboard",
      "Branded customer app",
      "Dual-agent fraud validation",
      "Multi-merchant + tax reporting",
      "Advanced SLA — 99.9% uptime",
      "Email + chat support",
    ],
    bestFor: "Regional fintechs, payment platforms, banks",
    ctaLabel: "Talk to sales",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Custom deployment, hosted or on-prem. Dedicated SLA.",
    setupFeeTTD: 0,
    monthlyFeeTTD: 0, // quoted per deal
    perVerificationTTD: 0,
    features: [
      "Everything in White-Label",
      "99.99% custom SLA",
      "24/7 priority support",
      "Dedicated account manager",
      "On-prem / hybrid deploy",
      "10,000 req/sec API tier",
    ],
    bestFor: "Banks, govt systems, large platforms, mobile money operators",
    ctaLabel: "Request quote",
  },
];

export function formatTTD(amount: number): string {
  return `TTD $${amount.toLocaleString("en-TT")}`;
}
