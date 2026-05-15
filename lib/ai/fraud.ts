export type FraudSignals = {
  imageUrlSeenBefore: boolean;
  amountMismatch: boolean;
  timeOfUpload: Date;
  uploadCountByAccountToday: number;
  knownFraudAccount: boolean;
};

export type FraudResult = {
  level: "low" | "medium" | "high" | "auto_reject";
  signals: string[];
  autoReject: boolean;
  message: string;
};

const MESSAGES: Record<FraudResult["level"], string> = {
  low: "Receipt looks clean. No significant fraud signals detected.",
  medium:
    "Some suspicious patterns detected. Manual review recommended before releasing the ticket.",
  high:
    "High-risk receipt. Do not process without manual verification — likely fraudulent.",
  auto_reject:
    "Receipt automatically rejected due to confirmed fraud indicators. Account flagged.",
};

/**
 * Deterministic rule-based fraud assessment (Phase 2 will layer an ML model on top).
 *
 * Rule priority (highest wins):
 *  1. knownFraudAccount                        → auto_reject
 *  2. amountMismatch AND imageUrlSeenBefore     → auto_reject
 *  3. imageUrlSeenBefore alone                  → high
 *  4. amountMismatch alone                      → high
 *  5. uploadCountByAccountToday > 3             → medium
 *  6. upload between 02:00 – 04:00 local        → medium
 *  7. none of the above                         → low
 */
export function assessFraud(signals: FraudSignals): FraudResult {
  const detectedSignals: string[] = [];

  if (signals.knownFraudAccount) {
    detectedSignals.push("Account is on the known-fraud blocklist.");
  }
  if (signals.imageUrlSeenBefore) {
    detectedSignals.push("Receipt image URL has been submitted before (possible copy-paste fraud).");
  }
  if (signals.amountMismatch) {
    detectedSignals.push("Amount on receipt does not match the expected order total.");
  }
  if (signals.uploadCountByAccountToday > 3) {
    detectedSignals.push(
      `Account submitted ${signals.uploadCountByAccountToday} receipts today — unusually high volume.`,
    );
  }

  const uploadHour = signals.timeOfUpload.getHours(); // local server time
  const isOddHours = uploadHour >= 2 && uploadHour < 4;
  if (isOddHours) {
    detectedSignals.push("Receipt uploaded between 02:00–04:00 — elevated risk window.");
  }

  // Evaluate level in priority order
  let level: FraudResult["level"];

  if (signals.knownFraudAccount) {
    level = "auto_reject";
  } else if (signals.amountMismatch && signals.imageUrlSeenBefore) {
    level = "auto_reject";
  } else if (signals.imageUrlSeenBefore || signals.amountMismatch) {
    level = "high";
  } else if (signals.uploadCountByAccountToday > 3 || isOddHours) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    level,
    signals: detectedSignals,
    autoReject: level === "auto_reject",
    message: MESSAGES[level],
  };
}
