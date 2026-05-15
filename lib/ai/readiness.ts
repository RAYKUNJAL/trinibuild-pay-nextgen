export type ReadinessCheck = {
  key: string;
  label: string;
  weight: number; // weights must sum to 100
  done: boolean;
};

export type ReadinessResult = {
  score: number; // 0-100 integer
  checks: ReadinessCheck[];
  alertLevel: "green" | "amber" | "red";
  message: string;
};

/**
 * Canonical check definitions. Weights sum to exactly 100.
 * Each entry is kept weight-only (done is false until runtime).
 */
export const READINESS_CHECK_DEFINITIONS: Omit<ReadinessCheck, "done">[] = [
  { key: "cover_image",         label: "Cover photo uploaded",                                  weight: 10 },
  { key: "description",         label: "Event description written",                              weight: 10 },
  { key: "at_least_one_tier",   label: "At least one ticket tier created",                       weight: 20 },
  { key: "payout_info_set",     label: "Payout bank details saved",                              weight: 20 },
  { key: "gate_open_time_set",  label: "Gate open time set",                                     weight:  5 },
  { key: "scanner_team_added",  label: "Scanner team member added (or you're scanning solo)",    weight: 10 },
  { key: "vip_codes_generated", label: "VIP codes created if needed",                            weight: 10 },
  { key: "social_share_done",   label: "Event shared on social media",                           weight: 15 },
];

const ALERT_MESSAGES: Record<"green" | "amber" | "red", string> = {
  green: "You good to go, boss! Everything looking crisp. 🟢",
  amber: "Almost there — knock out the remaining checks and your event will be fire. 🔥",
  red:   "Your event needs some work before you can go live, boss. Let's fix that up quick.",
};

/**
 * Compute the Promoter Readiness Score from a set of completed check keys.
 * Score = sum of weights for completed checks (0-100 integer).
 */
export function computeReadinessScore(doneKeys: string[]): ReadinessResult {
  const doneSet = new Set(doneKeys);

  const checks: ReadinessCheck[] = READINESS_CHECK_DEFINITIONS.map((def) => ({
    ...def,
    done: doneSet.has(def.key),
  }));

  const score = checks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0);

  const alertLevel: "green" | "amber" | "red" =
    score >= 80 ? "green" : score >= 50 ? "amber" : "red";

  return {
    score,
    checks,
    alertLevel,
    message: ALERT_MESSAGES[alertLevel],
  };
}

/**
 * Returns an urgency message suitable for a push notification when
 * the readiness score drops below 70 within 48 hours of the event (doc 3.1.4).
 *
 * Callers should only send the notification when score < 70 AND daysToEvent <= 2.
 */
export function getReadinessMessage(score: number, daysToEvent: number): string {
  if (score >= 70) {
    return ""; // no notification needed
  }

  if (daysToEvent <= 0) {
    return `Your event is today and your readiness score is ${score}/100 — finish up the remaining steps NOW, boss!`;
  }

  if (daysToEvent === 1) {
    return `Your event is TOMORROW and your readiness score is only ${score}/100. One more day — sort it out quick!`;
  }

  // daysToEvent === 2 (the 48-hr window)
  return `48 hours to go and your readiness is ${score}/100. Get those last items done before the crowd starts asking questions.`;
}
