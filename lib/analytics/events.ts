/**
 * Typed catalog of Plausible custom events.
 *
 * Keep keys SCREAMING_SNAKE and values snake_case so they read cleanly
 * in the Plausible dashboard.
 */
export const EVENTS = {
  HERO_CTA_FIND_FETE: "hero_cta_find_fete",
  HERO_CTA_PROMOTER: "hero_cta_promoter",
  ISLAND_CHIP_CLICK: "island_chip_click",
  FEATURED_EVENT_CLICK: "featured_event_click",
  COMPARISON_CHART_VIEW: "comparison_chart_view",
  FAQ_EXPAND: "faq_expand",
  WAITLIST_SUBMIT: "waitlist_submit",
  CHECKOUT_START: "checkout_start",
  CHECKOUT_COMPLETE: "checkout_complete",
  PASS_VIEW: "pass_view",
  PASS_ADD_TO_WALLET: "pass_add_to_wallet",
  DISCOVER_FILTER_USED: "discover_filter_used",
  DISCOVER_SEARCH: "discover_search",
} as const;

export type PlausibleEvent = (typeof EVENTS)[keyof typeof EVENTS];

export type PlausibleEventProps = Record<string, string | number | boolean>;
