import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Queue a WhatsApp delivery record for a pass.
 * Actual sending is handled by an external WhatsApp provider integration
 * (e.g. Twilio, WhatsApp Business API). This function records the intent
 * and can be extended to call a provider API.
 */
export async function queuePassDelivery(passId: string, phone: string): Promise<void> {
  const supabase = await createServiceClient();

  await supabase.from("whatsapp_delivery_log").insert({
    pass_id: passId,
    phone,
    status: "queued",
  });
}

/**
 * Mark a WhatsApp delivery as sent (called after provider confirmation).
 */
export async function markDeliverySent(passId: string): Promise<void> {
  const supabase = await createServiceClient();

  await supabase
    .from("whatsapp_delivery_log")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("pass_id", passId)
    .eq("status", "queued");
}

// ---------------------------------------------------------------------------
// Ticket delivery via Twilio WhatsApp API (doc 3.2.2)
// ---------------------------------------------------------------------------

export type WaTicketMessage = {
  to: string; // E.164 format e.g. +18681234567
  passerName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  tierName: string;
  passCode: string;
  qrImageUrl?: string; // public URL to QR image
};

export type WaDeliveryResult = {
  sent: boolean;
  sid?: string;
  error?: string;
};

/** Build the human-readable WhatsApp message body for a ticket. */
export function buildTicketText(msg: WaTicketMessage): string {
  return [
    `Hey ${msg.passerName}! 🎉`,
    ``,
    `Your ticket for *${msg.eventTitle}* is confirmed.`,
    ``,
    `📅 ${msg.eventDate}`,
    `📍 ${msg.venue}`,
    `🎟️ Tier: ${msg.tierName}`,
    ``,
    `Your pass code: *${msg.passCode}*`,
    `Show this at the door (or scan your QR).`,
    ``,
    `See you there! — WeFetePass`,
  ].join("\n");
}

/**
 * Send a ticket via Twilio WhatsApp API.
 *
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WA_FROM.
 * Optional: TWILIO_WA_CONTENT_SID (for pre-approved template messages).
 *
 * If credentials are not configured, logs a structured mock object and
 * returns {sent: false} — safe for local development.
 */
export async function sendTicketViaWhatsApp(
  msg: WaTicketMessage,
): Promise<WaDeliveryResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WA_FROM;
  const contentSid = process.env.TWILIO_WA_CONTENT_SID; // optional

  if (!accountSid || !authToken || !fromNumber) {
    const fallback = {
      mock: true,
      to:   msg.to,
      message: buildTicketText(msg),
      ...(msg.qrImageUrl ? { qrImageUrl: msg.qrImageUrl } : {}),
    };
    console.log("[whatsapp] not configured — mock payload:", JSON.stringify(fallback, null, 2));
    return { sent: false, error: "WhatsApp not configured — set TWILIO_* env vars" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: `whatsapp:${fromNumber}`,
    To:   `whatsapp:${msg.to}`,
    Body: buildTicketText(msg),
  });

  if (contentSid) {
    body.set("ContentSid", contentSid);
  }

  if (msg.qrImageUrl) {
    body.set("MediaUrl", msg.qrImageUrl);
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      return { sent: false, error: `Twilio error ${res.status}: ${text}` };
    }

    const json = (await res.json()) as { sid?: string };
    return { sent: true, sid: json.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { sent: false, error: `Network error: ${message}` };
  }
}
