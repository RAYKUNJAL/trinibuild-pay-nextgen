export type BankName =
  | 'Republic Bank'
  | 'First Citizens Bank'
  | 'Scotiabank Trinidad'
  | 'RBC Royal Bank'
  | 'JMMB Bank'
  | 'Other';

export type BankValidationResult = {
  valid: boolean;
  errors: string[];
  formattedAccountNumber: string;
  bankName: BankName | null;
};

const BANK_RULES: Record<BankName, { min: number; max: number }> = {
  'Republic Bank':        { min: 8,  max: 13 },
  'First Citizens Bank':  { min: 10, max: 10 },
  'Scotiabank Trinidad':  { min: 7,  max: 12 },
  'RBC Royal Bank':       { min: 7,  max: 12 },
  'JMMB Bank':            { min: 8,  max: 10 },
  'Other':                { min: 6,  max: 16 },
};

export const SUPPORTED_BANKS: BankName[] = [
  'Republic Bank',
  'First Citizens Bank',
  'Scotiabank Trinidad',
  'RBC Royal Bank',
  'JMMB Bank',
  'Other',
];

function stripAccountNumber(raw: string): string {
  return raw.replace(/[\s\-]/g, '');
}

export function extractLast4(accountNumber: string): string {
  const stripped = stripAccountNumber(accountNumber);
  return stripped.slice(-4);
}

export function maskAccountNumber(accountNumber: string): string {
  const last4 = extractLast4(accountNumber);
  return `**** **** ${last4}`;
}

export function validateTTBankAccount(
  bankName: string,
  accountNumber: string,
  _routingNumber?: string,
): BankValidationResult {
  const errors: string[] = [];
  const stripped = stripAccountNumber(accountNumber);

  // Check for invalid characters (only digits allowed after stripping spaces/dashes)
  if (!/^\d+$/.test(stripped)) {
    errors.push('Invalid characters in account number');
  }

  // Resolve bank name to known type
  const knownBank = SUPPORTED_BANKS.includes(bankName as BankName)
    ? (bankName as BankName)
    : null;

  const effectiveBank: BankName = knownBank ?? 'Other';
  const rules = BANK_RULES[effectiveBank];

  if (errors.length === 0) {
    if (stripped.length < rules.min) {
      errors.push(
        `Account number too short for ${bankName} (minimum ${rules.min} digits)`,
      );
    } else if (stripped.length > rules.max) {
      errors.push(
        `Account number too long for ${bankName} (maximum ${rules.max} digits)`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    formattedAccountNumber: maskAccountNumber(stripped),
    bankName: knownBank,
  };
}
