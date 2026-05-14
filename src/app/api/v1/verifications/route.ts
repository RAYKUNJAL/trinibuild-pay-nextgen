import { NextRequest } from "next/server";
import { z } from "zod";
import { parseAuthHeader, verifyApiKey } from "@/lib/api-keys";
import { createVerification } from "@/lib/verification";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const CreateBody = z.object({
  reference: z.string().min(1).max(128),
  bank_code: z.string().min(2).max(16),
  account_number: z.string().min(4).max(34),
  amount_minor: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  payer_name: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const key = parseAuthHeader(req.headers.get("authorization"));
  if (!key) return apiError("unauthorized", "Missing Bearer API key", 401);

  const apiKey = await verifyApiKey(key);
  if (!apiKey) return apiError("invalid_api_key", "API key is invalid or revoked", 401);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("invalid_json", "Body must be JSON", 400);
  }

  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return apiError("invalid_request", "Validation failed", 422, {
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  try {
    const verification = await createVerification({
      tenantId: apiKey.tenantId,
      reference: body.reference,
      bankCode: body.bank_code,
      accountNumber: body.account_number,
      amountMinor: body.amount_minor,
      currency: body.currency,
      payerName: body.payer_name,
    });

    return apiOk(
      {
        id: verification.id,
        reference: verification.reference,
        status: verification.status.toLowerCase(),
        amount_minor: verification.amountMinor,
        currency: verification.currency,
        bank_code: verification.bankCode,
        account_last4: verification.accountNumber,
        failure_reason: verification.failureReason,
        verified_at: verification.verifiedAt?.toISOString() ?? null,
        created_at: verification.createdAt.toISOString(),
      },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("Unique") || msg.includes("UNIQUE")) {
      return apiError("duplicate_reference", "Reference already exists for this tenant", 409);
    }
    return apiError("internal_error", "Failed to create verification", 500);
  }
}

export async function GET(req: NextRequest) {
  const key = parseAuthHeader(req.headers.get("authorization"));
  if (!key) return apiError("unauthorized", "Missing Bearer API key", 401);
  const apiKey = await verifyApiKey(key);
  if (!apiKey) return apiError("invalid_api_key", "API key is invalid or revoked", 401);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);
  const status = url.searchParams.get("status")?.toUpperCase();

  const rows = await prisma.verification.findMany({
    where: {
      tenantId: apiKey.tenantId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiOk({
    data: rows.map((v) => ({
      id: v.id,
      reference: v.reference,
      status: v.status.toLowerCase(),
      amount_minor: v.amountMinor,
      currency: v.currency,
      bank_code: v.bankCode,
      account_last4: v.accountNumber,
      created_at: v.createdAt.toISOString(),
    })),
  });
}
