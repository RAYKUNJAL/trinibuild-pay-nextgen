import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const LIVE_PREFIX = "cc_live_";
const TEST_PREFIX = "cc_test_";

export type GeneratedKey = {
  id: string;
  raw: string;
  prefix: string;
};

export async function createApiKey(
  tenantId: string,
  name: string,
  mode: "live" | "test" = "live"
): Promise<GeneratedKey> {
  const prefix = mode === "live" ? LIVE_PREFIX : TEST_PREFIX;
  const raw = `${prefix}${crypto.randomBytes(24).toString("hex")}`;
  const hash = await bcrypt.hash(raw, 10);
  const visiblePrefix = raw.slice(0, prefix.length + 4);

  const row = await prisma.apiKey.create({
    data: { tenantId, name, prefix: visiblePrefix, hash },
  });

  return { id: row.id, raw, prefix: visiblePrefix };
}

export async function verifyApiKey(rawKey: string) {
  if (!rawKey || (!rawKey.startsWith(LIVE_PREFIX) && !rawKey.startsWith(TEST_PREFIX))) {
    return null;
  }
  const visiblePrefix = rawKey.slice(0, 12);
  const candidates = await prisma.apiKey.findMany({
    where: { prefix: visiblePrefix, revokedAt: null },
    include: { tenant: true },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(rawKey, candidate.hash)) {
      void prisma.apiKey
        .update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});
      return candidate;
    }
  }
  return null;
}

export function parseAuthHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
