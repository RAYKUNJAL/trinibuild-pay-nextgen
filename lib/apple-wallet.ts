/**
 * Apple Wallet .pkpass generation helpers.
 *
 * Real .pkpass files are ZIP archives containing pass.json, manifest.json
 * (SHA-1 hashes of every included file), and a DER-encoded PKCS#7 signature
 * produced with an Apple-issued Pass Type ID certificate.
 *
 * This module provides:
 *   - generateApplePassPreview   — always available; returns the structured
 *                                  pass.json payload and metadata.
 *   - generateApplePassPkpass    — returns null when APPLE_WALLET_CERT is
 *                                  absent (graceful degradation). When the env
 *                                  var is present a real signing implementation
 *                                  can be dropped in here without touching any
 *                                  other file.
 */

export type PassPreviewInput = {
  passId: string;
  code: string;
  holderName: string;
  eventTitle: string;
  venue: string;
  city: string;
  startsAt: Date;
  tierName: string;
  organizationName?: string;
  coverImageUrl?: string;
  /** Pre-generated PNG data URL for the barcode visual in the preview UI */
  qrDataUrl: string;
};

export type PassPreview = {
  serialNumber: string;
  description: string;
  organizationName: string;
  /** Apple pass type identifier — swap for a real one when certs are added */
  passTypeIdentifier: string;
  /** Apple Developer Team ID placeholder */
  teamIdentifier: string;
  /** Brand gold */
  foregroundColor: string;
  /** Brand black */
  backgroundColor: string;
  eventTicket: {
    primaryFields: { key: string; label: string; value: string }[];
    secondaryFields: { key: string; label: string; value: string }[];
    auxiliaryFields: { key: string; label: string; value: string }[];
    backFields: { key: string; label: string; value: string }[];
  };
  barcodes: { message: string; format: string; messageEncoding: string }[];
  relevantDate: string;
  locations?: { longitude: number; latitude: number; relevantText: string }[];
};

/** Format a Date into an RFC 3339 string suitable for Apple Wallet relevantDate */
function toAppleDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

/** Human-readable event date for pass fields */
function formatEventDate(d: Date): string {
  return d.toLocaleString("en-TT", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Build a fully-populated PassPreview from event/pass data.
 * This is synchronous and has no external dependencies.
 */
export function generateApplePassPreview(data: PassPreviewInput): PassPreview {
  const orgName = data.organizationName ?? "WeFetePass";

  return {
    serialNumber: data.passId,
    description: data.eventTitle,
    organizationName: orgName,
    passTypeIdentifier: "pass.com.wefetepass.ticket",
    teamIdentifier: "TEAMID_PLACEHOLDER",
    foregroundColor: "rgb(241,209,154)",
    backgroundColor: "rgb(3,3,3)",

    eventTicket: {
      primaryFields: [
        {
          key: "event",
          label: "EVENT",
          value: data.eventTitle,
        },
      ],
      secondaryFields: [
        {
          key: "holder",
          label: "HOLDER",
          value: data.holderName,
        },
        {
          key: "tier",
          label: "TICKET TYPE",
          value: data.tierName,
        },
      ],
      auxiliaryFields: [
        {
          key: "venue",
          label: "VENUE",
          value: data.venue,
        },
        {
          key: "date",
          label: "DATE",
          value: formatEventDate(data.startsAt),
        },
      ],
      backFields: [
        {
          key: "passId",
          label: "PASS ID",
          value: data.passId,
        },
        {
          key: "code",
          label: "CODE",
          value: data.code,
        },
        {
          key: "city",
          label: "CITY",
          value: data.city,
        },
        {
          key: "terms",
          label: "TERMS",
          value:
            "This pass is non-transferable. Present this QR code at the door. Lost passes cannot be replaced.",
        },
        {
          key: "issuer",
          label: "ISSUED BY",
          value: orgName,
        },
      ],
    },

    barcodes: [
      {
        message: data.code,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
    ],

    relevantDate: toAppleDate(data.startsAt),
  };
}

/**
 * Attempt to produce a signed .pkpass Buffer.
 *
 * Returns null when APPLE_WALLET_CERT is not set — callers should fall back
 * to serving the PassPreview JSON with a 202 status.
 *
 * When APPLE_WALLET_CERT is present, a real PKCS#7 signing implementation
 * (e.g. via node-forge or openssl child-process) should be inserted here.
 * The function signature and null-return contract must stay stable.
 */
export async function generateApplePassPkpass(
  data: PassPreviewInput,
): Promise<Buffer | null> {
  if (!process.env.APPLE_WALLET_CERT) {
    return null;
  }

  // --- Real signing implementation goes here when certs are provisioned ---
  // Example outline (not executed):
  //   1. Generate pass.json from generateApplePassPreview(data)
  //   2. Bundle icon.png / logo.png assets
  //   3. Build manifest.json: { "pass.json": sha1hex, ... }
  //   4. Sign manifest.json with the P12 cert → DER PKCS#7 signature blob
  //   5. ZIP all files into a Buffer and return it
  // ------------------------------------------------------------------------

  return null;
}
