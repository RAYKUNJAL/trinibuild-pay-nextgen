import { apiError, apiOk } from "@/lib/api-response";
import { readSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSessionFromCookie();
  if (!session) return apiError("unauthorized", "Login required", 401);

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [total, verified, failed, recent] = await Promise.all([
    prisma.verification.count({
      where: { tenantId: session.tenantId, createdAt: { gte: since } },
    }),
    prisma.verification.count({
      where: { tenantId: session.tenantId, status: "VERIFIED", createdAt: { gte: since } },
    }),
    prisma.verification.count({
      where: { tenantId: session.tenantId, status: "FAILED", createdAt: { gte: since } },
    }),
    prisma.verification.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        reference: true,
        status: true,
        amountMinor: true,
        currency: true,
        bankCode: true,
        accountNumber: true,
        createdAt: true,
      },
    }),
  ]);

  return apiOk({
    period: { start: since.toISOString(), end: new Date().toISOString() },
    totals: { all: total, verified, failed },
    recent: recent.map((r) => ({
      id: r.id,
      reference: r.reference,
      status: r.status.toLowerCase(),
      amount_minor: r.amountMinor,
      currency: r.currency,
      bank_code: r.bankCode,
      account_last4: r.accountNumber,
      created_at: r.createdAt.toISOString(),
    })),
  });
}
