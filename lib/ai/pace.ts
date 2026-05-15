export type PaceInput = {
  eventId: string;
  daysUntilEvent: number;
  currentSales: number;
  capacity: number;
  promoterHistoricalSalesAtSameDaysOut: number | null; // avg passes sold by this day-out in past events
};

export type PaceResult = {
  currentPacePct: number; // currentSales / capacity * 100
  historicalPacePct: number | null; // historical sales / capacity * 100
  relativeToHistorical: number | null; // currentPacePct / historicalPacePct * 100
  alertLevel: "on_track" | "slightly_behind" | "behind" | "critical";
  message: string;
};

const MESSAGES: Record<PaceResult["alertLevel"], (pct: number, rel: number | null) => string> = {
  on_track: (pct, rel) =>
    rel !== null
      ? `You on track, boss! Sales at ${pct}% — ${rel}% of your usual pace at this stage.`
      : `You on track, boss! ${pct}% of capacity sold.`,

  slightly_behind: (pct, rel) =>
    rel !== null
      ? `Sales a lil slow — you're at ${rel}% of your usual pace. A push to your crowd now could catch it up.`
      : `Sales a lil slow at ${pct}% of capacity. Time to activate your crew.`,

  behind: (pct, rel) =>
    rel !== null
      ? `Yuh behind, fam. Only ${rel}% of your historical pace — fire off a WhatsApp blast and lean on your street team.`
      : `Yuh behind — ${pct}% of capacity sold. Get the word out now.`,

  critical: (pct, rel) =>
    rel !== null
      ? `Critical — sales at only ${rel}% of your normal pace. This event needs urgent attention. Drop prices, push hard, or consider moving the date.`
      : `Critical — only ${pct}% sold. Urgent action needed: promo push, price drop, or date review.`,
};

/**
 * Assess current ticket sales pace against capacity and promoter historical average.
 *
 * relativeToHistorical thresholds (doc 3.1.1):
 *   >= 85% of historical  → on_track
 *   70–84%                → slightly_behind
 *   50–69%                → behind
 *   < 50%                 → critical
 *
 * When no historical baseline exists, fall back to raw currentPacePct to
 * determine level using the same thresholds.
 */
export function assessPace(input: PaceInput): PaceResult {
  const { currentSales, capacity, promoterHistoricalSalesAtSameDaysOut } = input;

  const currentPacePct =
    capacity > 0 ? Math.round((currentSales / capacity) * 100) : 0;

  let historicalPacePct: number | null = null;
  let relativeToHistorical: number | null = null;

  if (
    promoterHistoricalSalesAtSameDaysOut !== null &&
    promoterHistoricalSalesAtSameDaysOut > 0 &&
    capacity > 0
  ) {
    historicalPacePct = Math.round(
      (promoterHistoricalSalesAtSameDaysOut / capacity) * 100,
    );
    // How does current pace compare to historical, as a percentage
    relativeToHistorical = Math.round((currentPacePct / historicalPacePct) * 100);
  }

  const comparator = relativeToHistorical ?? currentPacePct;

  let alertLevel: PaceResult["alertLevel"];
  if (comparator >= 85) {
    alertLevel = "on_track";
  } else if (comparator >= 70) {
    alertLevel = "slightly_behind";
  } else if (comparator >= 50) {
    alertLevel = "behind";
  } else {
    alertLevel = "critical";
  }

  return {
    currentPacePct,
    historicalPacePct,
    relativeToHistorical,
    alertLevel,
    message: MESSAGES[alertLevel](currentPacePct, relativeToHistorical),
  };
}
