"use client";

import { useEffect } from "react";

export function trackExposure(experimentId: string, variant: string) {
  if (typeof window === "undefined") return;
  const plausible = (window as unknown as { plausible?: (event: string, opts?: { props?: Record<string, string> }) => void }).plausible;
  if (typeof plausible === "function") {
    plausible("ab_exposure", { props: { experiment: experimentId, variant } });
  }
}

/**
 * Fires a single exposure event on mount. Pair this with a `<Variant>` block by
 * dropping a tiny client component inside the branch that should be tracked.
 */
export function useExposure(experimentId: string, variant: string) {
  useEffect(() => {
    trackExposure(experimentId, variant);
    // run once per mount per (experiment, variant) pair
  }, [experimentId, variant]);
}
