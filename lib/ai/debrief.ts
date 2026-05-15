import { formatTTD } from "@/lib/utils";

export type DebriefInput = {
  eventTitle: string;
  startedAt: Date;
  endedAt: Date;
  capacity: number;
  totalPasses: number;
  usedPasses: number;
  revByTier: { tierName: string; qty: number; revenueCents: number }[];
  peakEntryHour: number; // 0-23
  refundedOrders: number;
  noShows: number; // valid passes never scanned after event ended
  historicalAvgAttendancePct?: number; // promoter's past events average
  platformAvgAttendancePct?: number;
};

export type DebriefReport = {
  summary: string;
  attendancePct: number;
  revenueTTD: number;
  topTier: string;
  peakEntryTime: string; // e.g., "10:00 PM – 11:00 PM"
  noShowPct: number;
  vsFeelingLine: string; // comparative context line
  recommendations: string[]; // exactly 3 rule-based recs for next event
  shareableCardText: string; // ~80-char social snippet
};

/** Format a 0-23 hour integer as "hh:mm AM/PM – hh:mm AM/PM" window. */
function formatPeakWindow(hour: number): string {
  const fmt = (h: number): string => {
    const period = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${period}`;
  };
  return `${fmt(hour)} – ${fmt(hour + 1)}`;
}

/** Pick the tier with the highest revenue. */
function findTopTier(revByTier: DebriefInput["revByTier"]): string {
  if (revByTier.length === 0) return "N/A";
  return [...revByTier].sort((a, b) => b.revenueCents - a.revenueCents)[0].tierName;
}

/** Pick the tier with the lowest price per ticket (lowest revenueCents / qty). */
function findLowestPriceTier(revByTier: DebriefInput["revByTier"]): string | null {
  if (revByTier.length < 2) return null;
  const tiersWithPPT = revByTier
    .filter((t) => t.qty > 0)
    .map((t) => ({ name: t.tierName, ppt: t.revenueCents / t.qty }));
  if (tiersWithPPT.length === 0) return null;
  tiersWithPPT.sort((a, b) => a.ppt - b.ppt);
  return tiersWithPPT[0].name;
}

/**
 * Generate a deterministic, rule-based post-event debrief report.
 * Phase 2 will replace the template strings with an LLM call.
 */
export function generateDebrief(input: DebriefInput): DebriefReport {
  const {
    eventTitle,
    capacity,
    totalPasses,
    usedPasses,
    revByTier,
    peakEntryHour,
    noShows,
    historicalAvgAttendancePct,
    platformAvgAttendancePct,
  } = input;

  const attendancePct =
    totalPasses > 0 ? Math.round((usedPasses / totalPasses) * 100) : 0;

  const totalRevenueCents = revByTier.reduce((s, t) => s + t.revenueCents, 0);
  const revenueTTD = totalRevenueCents / 100;

  const topTier = findTopTier(revByTier);
  const peakEntryTime = formatPeakWindow(peakEntryHour);
  const noShowPct =
    totalPasses > 0 ? Math.round((noShows / totalPasses) * 100) : 0;

  // --- Comparative feeling line ---
  let vsFeelingLine: string;
  if (historicalAvgAttendancePct !== undefined) {
    const diff = attendancePct - historicalAvgAttendancePct;
    if (diff >= 5) {
      vsFeelingLine = `This was your best-attended event yet — ${diff} points above your usual average.`;
    } else if (diff <= -5) {
      vsFeelingLine = `Attendance came in ${Math.abs(diff)} points below your historical average — worth reviewing the promo strategy.`;
    } else {
      vsFeelingLine = `Attendance was right in line with your usual average. Consistent.`;
    }
  } else if (platformAvgAttendancePct !== undefined) {
    const diff = attendancePct - platformAvgAttendancePct;
    if (diff >= 5) {
      vsFeelingLine = `You beat the WeFetePass platform average by ${diff} points. Big up!`;
    } else if (diff <= -5) {
      vsFeelingLine = `Attendance was ${Math.abs(diff)} points below the platform average for similar events.`;
    } else {
      vsFeelingLine = `Attendance matched the WeFetePass platform average.`;
    }
  } else {
    vsFeelingLine = `${attendancePct}% of ticket holders showed up. Keep tracking events to build your benchmark.`;
  }

  // --- Rule-based recommendations (always exactly 3) ---
  const recs: string[] = [];

  // Rule 1: high no-show → suggest installments to increase commitment
  if (noShowPct > 25) {
    recs.push(
      "High no-show rate detected. Consider installment payment plans next time — buyers who pay in stages show up more consistently.",
    );
  } else if (attendancePct < 60) {
    recs.push(
      "Less than 60% attendance — try WhatsApp reminders the day before and morning of the event to reduce no-shows.",
    );
  } else {
    recs.push(
      "Solid turnout! Keep up the pre-event WhatsApp hype and day-of reminders to push attendance even higher.",
    );
  }

  // Rule 2: gate open time / peak entry
  // If peak entry is before 9 PM (hour < 21) crowd arrived early — suggest later gate
  if (peakEntryHour < 21) {
    recs.push(
      "Your crowd peaked early. Consider pushing gate open time later to build a stronger late-night vibe and maintain energy.",
    );
  } else if (peakEntryHour >= 23) {
    recs.push(
      "Peak entry was after 11 PM — there may be a bottleneck at the gate. Add a second scanner team member next time for faster flow.",
    );
  } else {
    recs.push(
      "Peak entry timing was solid. Keep your gate open time consistent — your crowd has found their rhythm.",
    );
  }

  // Rule 3: revenue tier composition — if top tier is also lowest price, push premium
  const lowestPriceTier = findLowestPriceTier(revByTier);
  if (lowestPriceTier !== null && lowestPriceTier === topTier) {
    recs.push(
      `Your cheapest tier drove the most revenue. Add a premium or VIP tier next event — even 20% uptake at 2× price meaningfully lifts total revenue.`,
    );
  } else if (revByTier.length === 1) {
    recs.push(
      "You only had one ticket tier. Try an Early Bird + Standard split next time — early buyers lock in and help fund early costs.",
    );
  } else {
    recs.push(
      `"${topTier}" was your top-earning tier. Feature it prominently in your promo materials to drive even higher uptake.`,
    );
  }

  // --- Summary ---
  const summary =
    `${eventTitle} wrapped up with ${usedPasses} of ${totalPasses} tickets used ` +
    `(${attendancePct}% attendance) against a capacity of ${capacity}. ` +
    `Total revenue: ${formatTTD(totalRevenueCents)}. ` +
    `Peak entry was ${peakEntryTime}.`;

  // --- Shareable card (~80 chars) ---
  const shareableCardText =
    `${usedPasses} people rocked ${eventTitle}! ${vsFeelingLine.split(".")[0]}. Powered by WeFetePass.`
      .slice(0, 160); // generous cap for WhatsApp preview

  return {
    summary,
    attendancePct,
    revenueTTD,
    topTier,
    peakEntryTime,
    noShowPct,
    vsFeelingLine,
    recommendations: recs,
    shareableCardText,
  };
}
