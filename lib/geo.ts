// Note: in local dev there are no geo headers, so detectIsland() returns null. Callers must handle that.
import "server-only";
import { headers } from "next/headers";

// Country-code → island-code mapping for Caribbean territories we serve.
// Maps to the same codes used in `lib/islands.ts`.
const COUNTRY_TO_ISLAND: Record<string, string> = {
  TT: "tt", JM: "jm", BB: "bb", GY: "gy", GD: "gd", LC: "lc",
  AG: "ag", VC: "vc", DM: "dm", BS: "bs", KN: "kn", VI: "vi",
};

export async function detectIsland(): Promise<string | null> {
  const h = await headers();
  // Vercel: x-vercel-ip-country. Cloudflare: cf-ipcountry. Generic fallback: x-country.
  const cc =
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country") ??
    null;
  if (!cc) return null;
  return COUNTRY_TO_ISLAND[cc.toUpperCase()] ?? null;
}

export async function detectIslandWithFallback(defaultIsland = "tt"): Promise<string> {
  const detected = await detectIsland();
  return detected ?? defaultIsland;
}
