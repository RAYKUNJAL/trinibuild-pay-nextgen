export type SupportedCurrency = "TTD" | "USD" | "BBD" | "JMD" | "GYD";

/**
 * Hardcoded exchange rates relative to TTD (1 TTD = x foreign currency).
 * These are approximate 2025 values — update periodically or replace with
 * a live-rate fetch in Phase 3 (doc 3.4.4).
 */
export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  TTD: 1,
  USD: 0.148,  // 1 TTD ≈ 0.148 USD
  BBD: 0.297,  // 1 TTD ≈ 0.297 Barbados dollars
  JMD: 23.2,   // 1 TTD ≈ 23.2 Jamaican dollars
  GYD: 31.0,   // 1 TTD ≈ 31.0 Guyanese dollars
};

/** ISO 4217 locale strings for Intl.NumberFormat. */
const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  TTD: "en-TT",
  USD: "en-US",
  BBD: "en-BB",
  JMD: "en-JM",
  GYD: "en-GY",
};

/**
 * Convert an amount in TTD cents to the target currency, returning a
 * fractional amount rounded to the nearest integer cent-equivalent.
 *
 * e.g. convertFromTTD(10000, 'USD') → 148  (TTD 100 ≈ USD 1.48 → 148 USD cents)
 */
export function convertFromTTD(
  amountCents: number,
  toCurrency: SupportedCurrency,
): number {
  const rate = EXCHANGE_RATES[toCurrency];
  return Math.round(amountCents * rate);
}

/**
 * Format an amount (in the currency's smallest unit / cents) as a
 * human-readable string using the correct locale and currency symbol.
 *
 * e.g. formatCurrency(10000, 'TTD') → "TT$100.00"
 *      formatCurrency(148, 'USD')   → "$1.48"
 */
export function formatCurrency(
  amountCents: number,
  currency: SupportedCurrency,
): string {
  const locale = CURRENCY_LOCALES[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

/**
 * Returns the currency symbol for a given supported currency.
 * Uses Intl to derive the symbol rather than hardcoding, so it stays
 * consistent with browser/Node locale behaviour.
 */
export function getLocaleCurrencySymbol(currency: SupportedCurrency): string {
  const locale = CURRENCY_LOCALES[currency];
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(0);

  return parts.find((p) => p.type === "currency")?.value ?? currency;
}
