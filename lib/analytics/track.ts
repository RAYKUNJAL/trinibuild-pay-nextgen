"use client";

import { useEffect, useRef } from "react";
import type { PlausibleEvent, PlausibleEventProps } from "./events";

type PlausibleFn = {
  (event: string, options?: { props?: PlausibleEventProps; callback?: () => void }): void;
  q?: IArguments[];
};

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

/**
 * Fire a typed Plausible custom event.
 *
 * Safe to call during SSR (no-op) and before the Plausible script has
 * loaded — calls are buffered onto `window.plausible.q` and replayed by
 * the script once it boots.
 */
export function track(event: PlausibleEvent, props?: PlausibleEventProps): void {
  if (typeof window === "undefined") return;

  // Ensure queue fallback exists even if AnalyticsScript hasn't mounted yet.
  if (!window.plausible) {
    const fn = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      (fn.q = fn.q || []).push(arguments);
    } as PlausibleFn;
    fn.q = [];
    window.plausible = fn;
  }

  window.plausible(event, props ? { props } : undefined);
}

/**
 * Fire an event exactly once when the component mounts.
 * Useful for "view" style events like PASS_VIEW or COMPARISON_CHART_VIEW.
 */
export function useTrackOnce(event: PlausibleEvent, props?: PlausibleEventProps): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // We intentionally omit `props` from deps — re-running on prop identity
    // changes would defeat the "once" semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
