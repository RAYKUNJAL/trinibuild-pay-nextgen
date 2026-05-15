/**
 * Google Wallet generic pass generation helpers.
 *
 * Google Wallet passes are JWT-signed payloads POSTed to the Save-to-Wallet
 * URL: https://pay.google.com/gp/v/save/<jwt>
 *
 * The JWT must be signed with RS256 using a Google Cloud service account
 * private key (GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY env var, PEM format).
 *
 * When the env var is absent generateGoogleWalletPass returns saveUrl: null
 * but always returns the full jwtPayload for debugging / future activation.
 */

import { SignJWT, importPKCS8 } from "jose";

export type GoogleWalletPassInput = {
  passId: string;
  code: string;
  holderName: string;
  eventTitle: string;
  venue: string;
  city: string;
  startsAt: Date;
  tierName: string;
  organizerName?: string;
  heroImageUrl?: string;
};

export type GoogleWalletResult = {
  /** null when GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY is not set */
  saveUrl: string | null;
  objectId: string;
  /** Always present — useful for logging / developer tooling */
  jwtPayload: object;
};

const ISSUER_ID = "wefetepass";
const CLASS_SUFFIX = "carnival_ticket";
const CLASS_ID = `${ISSUER_ID}.${CLASS_SUFFIX}`;

function formatDate(d: Date): string {
  return d.toISOString();
}

function buildPayload(input: GoogleWalletPassInput): object {
  const objectId = `${ISSUER_ID}.${input.passId}`;

  const genericClass = {
    id: CLASS_ID,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: { fields: [{ fieldPath: "object.textModulesData['venue']" }] },
              },
              endItem: {
                firstValue: { fields: [{ fieldPath: "object.textModulesData['date']" }] },
              },
            },
          },
        ],
      },
    },
  };

  const textModulesData: {
    id: string;
    header: string;
    body: string;
  }[] = [
    { id: "holder", header: "HOLDER", body: input.holderName },
    {
      id: "venue",
      header: "VENUE",
      body: `${input.venue}, ${input.city}`,
    },
    {
      id: "date",
      header: "DATE",
      body: input.startsAt.toLocaleString("en-TT", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    },
    { id: "tier", header: "TICKET TYPE", body: input.tierName },
  ];

  const genericObject: Record<string, unknown> = {
    id: objectId,
    classId: CLASS_ID,
    state: "ACTIVE",
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: input.organizerName ?? "WeFetePass",
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: input.eventTitle,
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: input.tierName,
      },
    },
    barcode: {
      type: "QR_CODE",
      value: input.code,
      alternateText: input.code,
    },
    textModulesData,
    validTimeInterval: {
      start: { date: formatDate(input.startsAt) },
    },
  };

  if (input.heroImageUrl) {
    genericObject.heroImage = {
      sourceUri: { uri: input.heroImageUrl },
      contentDescription: {
        defaultValue: { language: "en-US", value: input.eventTitle },
      },
    };
  }

  return {
    iss: "wefetepass-service@wefetepass.iam.gserviceaccount.com",
    aud: "google",
    typ: "savetowallet",
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  };
}

/**
 * Build a Google Wallet pass and attempt to sign the JWT.
 *
 * When GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY is not set, saveUrl is null
 * but jwtPayload is always returned for debugging.
 */
export async function generateGoogleWalletPass(
  input: GoogleWalletPassInput,
): Promise<GoogleWalletResult> {
  const objectId = `${ISSUER_ID}.${input.passId}`;
  const payload = buildPayload(input);

  const privateKeyPem = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKeyPem) {
    return { saveUrl: null, objectId, jwtPayload: payload };
  }

  try {
    const privateKey = await importPKCS8(privateKeyPem, "RS256");
    const jwt = await new SignJWT(payload as Record<string, unknown>)
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(privateKey);

    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;
    return { saveUrl, objectId, jwtPayload: payload };
  } catch (err) {
    console.error("[google-wallet] JWT signing failed:", err);
    return { saveUrl: null, objectId, jwtPayload: payload };
  }
}
