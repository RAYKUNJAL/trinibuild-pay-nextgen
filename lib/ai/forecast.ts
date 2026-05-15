import { formatTTD } from "@/lib/utils";

export type ForecastInput = {
  eventType: "soca" | "all_inclusive" | "cooler_fete" | "club_night" | "dancehall" | "other";
  venueCityTier: "port_of_spain" | "san_fernando" | "tobago" | "other";
  capacity: number;
  daysUntilEvent: number;
  isCarnivalSeason: boolean; // Jan–Feb in T&T
  historicalSimilarMedianCents: number | null;
};

export type ForecastResult = {
  suggestedFloorCents: number;
  suggestedCeilingCents: number;
  confidenceLabel: "high" | "medium" | "low";
  rationale: string;
};

/**
 * Base floor/ceiling in TTD cents for each event type.
 * all_inclusive events command the highest pricing in the Caribbean market;
 * club nights tend to be impulse / walk-in so ceilings are lower.
 */
const EVENT_TYPE_BASE: Record<
  ForecastInput["eventType"],
  { floorCents: number; ceilingCents: number }
> = {
  all_inclusive: { floorCents: 45000, ceilingCents: 85000 }, // TTD 450 – 850
  soca:          { floorCents: 25000, ceilingCents: 55000 }, // TTD 250 – 550
  cooler_fete:   { floorCents: 20000, ceilingCents: 40000 }, // TTD 200 – 400
  dancehall:     { floorCents: 20000, ceilingCents: 35000 }, // TTD 200 – 350
  club_night:    { floorCents: 10000, ceilingCents: 25000 }, // TTD 100 – 250
  other:         { floorCents: 20000, ceilingCents: 35000 }, // TTD 200 – 350
};

/**
 * City tier multipliers.
 * Port of Spain supports a ~15% premium; Tobago events often attract tourists
 * but local buying power is lower — slight discount vs POS.
 */
const CITY_MULTIPLIERS: Record<ForecastInput["venueCityTier"], number> = {
  port_of_spain: 1.0,
  san_fernando:  0.88,
  tobago:        0.92,
  other:         0.85,
};

const CARNIVAL_PREMIUM = 1.40; // +40% during Carnival season (Jan–Feb)

/**
 * Rule-based demand forecast returning a suggested price band in TTD cents.
 *
 * Confidence is HIGH when historical median is available AND within 30 days,
 * MEDIUM when historical is available or daysUntilEvent is short,
 * LOW otherwise.
 */
export function forecastPricing(input: ForecastInput): ForecastResult {
  const base = EVENT_TYPE_BASE[input.eventType];
  const cityMult = CITY_MULTIPLIERS[input.venueCityTier];

  let floorCents = Math.round(base.floorCents * cityMult);
  let ceilingCents = Math.round(base.ceilingCents * cityMult);

  // Carnival season: demand spikes significantly
  if (input.isCarnivalSeason) {
    floorCents  = Math.round(floorCents  * CARNIVAL_PREMIUM);
    ceilingCents = Math.round(ceilingCents * CARNIVAL_PREMIUM);
  }

  // Large venues (2000+) → widen band to account for tiered pricing needs
  if (input.capacity >= 2000) {
    floorCents   = Math.round(floorCents  * 0.85); // lower floor for accessibility
    ceilingCents = Math.round(ceilingCents * 1.20); // higher ceiling for premium tiers
  }

  // Last-minute events (<7 days) — floor can be discounted to clear inventory
  if (input.daysUntilEvent < 7) {
    floorCents = Math.round(floorCents * 0.90);
  }

  // Blend in historical median if available (weight it 30%)
  const rationeParts: string[] = [];
  if (input.historicalSimilarMedianCents !== null) {
    const median = input.historicalSimilarMedianCents;
    const blendedMidpoint = Math.round(
      (floorCents + ceilingCents) / 2 * 0.7 + median * 0.3,
    );
    // Nudge the band toward the blended midpoint
    const halfBand = Math.round((ceilingCents - floorCents) / 2);
    floorCents   = blendedMidpoint - halfBand;
    ceilingCents = blendedMidpoint + halfBand;
    rationeParts.push(
      `Historical median for similar events is ${formatTTD(median)} (30% weight applied).`,
    );
  }

  // Confidence scoring
  let confidenceLabel: ForecastResult["confidenceLabel"];
  if (input.historicalSimilarMedianCents !== null && input.daysUntilEvent <= 30) {
    confidenceLabel = "high";
  } else if (input.historicalSimilarMedianCents !== null || input.daysUntilEvent <= 14) {
    confidenceLabel = "medium";
  } else {
    confidenceLabel = "low";
  }

  // Build rationale
  rationeParts.unshift(
    `${input.eventType.replace(/_/g, " ")} event in ${input.venueCityTier.replace(/_/g, " ")} ` +
    `(city multiplier: ${cityMult}).`,
  );
  if (input.isCarnivalSeason) {
    rationeParts.push("Carnival season premium (+40%) applied.");
  }
  if (input.capacity >= 2000) {
    rationeParts.push("Large venue (2000+ capacity): band widened to support multi-tier pricing.");
  }
  if (input.daysUntilEvent < 7) {
    rationeParts.push("Event is less than 7 days out: floor reduced 10% to help clear inventory.");
  }
  rationeParts.push(
    `Suggested range: ${formatTTD(floorCents)} – ${formatTTD(ceilingCents)} TTD.`,
  );

  return {
    suggestedFloorCents:   floorCents,
    suggestedCeilingCents: ceilingCents,
    confidenceLabel,
    rationale: rationeParts.join(" "),
  };
}
