import "server-only";
import { headers } from "next/headers";
import { EXPERIMENTS, type ExperimentKey, type VariantOf } from "./variants";

export async function getVariant<K extends ExperimentKey>(key: K): Promise<VariantOf<K>> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anon";
  const ua = h.get("user-agent") ?? "";
  const dayBucket = Math.floor(Date.now() / 86_400_000); // rotates daily
  const seed = `${ip}|${ua}|${key}|${dayBucket}`;
  const hash = await sha256Mod(seed, EXPERIMENTS[key].variants.length);
  return EXPERIMENTS[key].variants[hash] as VariantOf<K>;
}

async function sha256Mod(input: string, n: number): Promise<number> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  // use first 4 bytes as uint32
  const bytes = new Uint8Array(buf);
  const num = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  return Math.abs(num) % n;
}
