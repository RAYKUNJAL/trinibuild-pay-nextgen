import { NextRequest } from "next/server";
import { parseAuthHeader, verifyApiKey } from "@/lib/api-keys";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = parseAuthHeader(req.headers.get("authorization"));
  if (!key) return apiError("unauthorized", "Missing Bearer API key", 401);
  const apiKey = await verifyApiKey(key);
  if (!apiKey) return apiError("invalid_api_key", "API key is invalid or revoked", 401);

  const v = await prisma.verification.findFirst({
    where: { id, tenantId: apiKey.tenantId },
  });
  if (!v) return apiError("not_found", "Verification not found", 404);

  return apiOk({
    id: v.id,
    reference: v.reference,
    status: v.status.toLowerCase(),
    amount_minor: v.amountMinor,
    currency: v.currency,
    bank_code: v.bankCode,
    account_last4: v.accountNumber,
    failure_reason: v.failureReason,
    verified_at: v.verifiedAt?.toISOString() ?? null,
    created_at: v.createdAt.toISOString(),
  });
}
