import Script from "next/script";

/**
 * Mounts Plausible Analytics.
 *
 * Reads `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (required to activate) and an optional
 * `NEXT_PUBLIC_PLAUSIBLE_API_HOST` for self-hosted instances. When the domain
 * is unset (e.g. local dev), this renders nothing so analytics is not polluted.
 *
 * Uses the `outbound-links` + `tagged-events` bundle so we get free
 * outbound-link tracking and `data-event-*` attribute tracking on top of
 * the typed `track()` helper.
 */
export function AnalyticsScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || "https://plausible.io";
  const src = `${host}/js/script.outbound-links.tagged-events.js`;
  const isSelfHosted = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST);

  return (
    <>
      <Script
        id="plausible-script"
        strategy="afterInteractive"
        src={src}
        data-domain={domain}
        {...(isSelfHosted ? { "data-api": `${host}/api/event` } : {})}
      />
      <Script
        id="plausible-init"
        strategy="afterInteractive"
        // Queue fallback: buffer calls fired before the main script loads.
        dangerouslySetInnerHTML={{
          __html:
            "window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }",
        }}
      />
    </>
  );
}

export default AnalyticsScript;
