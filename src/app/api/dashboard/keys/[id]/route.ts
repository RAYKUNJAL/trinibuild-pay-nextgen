import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { readSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readSessionFromCookie();
  if (!session) return apiError("unauthorized", "Login required", 401);
  const { id } = await params;

  const key = await prisma.apiKey.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!key) return apiError("not_found", "Key not found", 404);

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() },
  });
  return apiOk({ ok: true });
}
