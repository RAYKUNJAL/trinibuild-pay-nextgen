import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { readSessionFromCookie } from "@/lib/auth";
import { createApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSessionFromCookie();
  if (!session) return apiError("unauthorized", "Login required", 401);

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
  return apiOk({ data: keys });
}

const Body = z.object({
  name: z.string().min(1).max(80),
  mode: z.enum(["live", "test"]).default("live"),
});

export async function POST(req: NextRequest) {
  const session = await readSessionFromCookie();
  if (!session) return apiError("unauthorized", "Login required", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("invalid_request", "Validation failed", 422);

  const created = await createApiKey(session.tenantId, parsed.data.name, parsed.data.mode);
  return apiOk({ id: created.id, prefix: created.prefix, raw: created.raw }, 201);
}
