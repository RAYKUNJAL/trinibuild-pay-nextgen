import { prisma } from "./db";
import { VerificationStatus } from "@prisma/client";

export type CreateVerificationInput = {
  tenantId: string;
  reference: string;
  bankCode: string;
  accountNumber: string;
  amountMinor: number;
  currency?: string;
  payerName?: string | null;
};

// Dual-agent validation stub: in production this calls bank rails + ML fraud agent.
// Deterministic for tests: amount > 0 + valid bank code → VERIFIED; else FAILED.
const SUPPORTED_BANKS = new Set(["RBL", "RBC", "FCB", "SCO", "CIBC", "ANSA"]);

export async function createVerification(input: CreateVerificationInput) {
  const last4 = input.accountNumber.slice(-4).padStart(4, "0");

  const initialStatus: VerificationStatus =
    input.amountMinor > 0 && SUPPORTED_BANKS.has(input.bankCode)
      ? VerificationStatus.VERIFIED
      : VerificationStatus.FAILED;

  const failureReason =
    initialStatus === VerificationStatus.FAILED
      ? input.amountMinor <= 0
        ? "amount_must_be_positive"
        : "unsupported_bank_code"
      : null;

  return prisma.verification.create({
    data: {
      tenantId: input.tenantId,
      reference: input.reference,
      bankCode: input.bankCode,
      accountNumber: last4,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "TTD",
      payerName: input.payerName ?? null,
      status: initialStatus,
      failureReason,
      verifiedAt: initialStatus === VerificationStatus.VERIFIED ? new Date() : null,
    },
  });
}
