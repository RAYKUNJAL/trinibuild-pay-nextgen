/**
 * Offline-notice banner — server component, no interactivity.
 * Informs the pass holder their QR code is usable without connectivity.
 */

export function OfflineNotice() {
  return (
    <div
      role="note"
      aria-label="Offline pass tip"
      className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <span className="mt-px shrink-0 text-base leading-none" aria-hidden>
        &#9888;
      </span>
      <p className="leading-snug">
        <strong className="font-semibold">No internet? No problem.</strong>{" "}
        Your QR code works without an internet connection — screenshot it before
        you go so it&apos;s always ready at the door.
      </p>
    </div>
  );
}
