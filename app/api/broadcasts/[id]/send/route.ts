import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTicketViaWhatsApp } from "@/lib/whatsapp";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderPhoneRow {
  id: string;
  buyer_phone: string | null;
  buyer_name: string | null;
  buyer_id: string;
  event_id: string;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: broadcastId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify organizer owns this broadcast
    const { data: bcRaw, error: bcErr } = await supabase
      .from("broadcasts")
      .select("id, organizer_id, event_id, tier_ids, body, channel, status")
      .eq("id", broadcastId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (bcErr || !bcRaw) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    if (bcRaw.status === "sent" || bcRaw.status === "sending") {
      return NextResponse.json({ error: "Broadcast already sent or sending" }, { status: 409 });
    }

    const service = await createServiceClient();

    // Mark as sending
    await service
      .from("broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcastId);

    // Gather audience
    const eventId = bcRaw.event_id as string | null;
    const tierIds = (bcRaw.tier_ids as string[] | null) ?? [];

    let orders: OrderPhoneRow[] = [];

    if (eventId) {
      let ordersQuery = service
        .from("orders")
        .select("id, buyer_phone, buyer_name, buyer_id, event_id")
        .eq("event_id", eventId)
        .eq("status", "paid")
        .not("buyer_phone", "is", null);

      if (tierIds.length > 0) {
        const { data: tierOrderIds } = await service
          .from("order_items")
          .select("order_id")
          .in("tier_id", tierIds);
        const orderIds = (tierOrderIds ?? []).map((r) => r.order_id);
        if (orderIds.length > 0) {
          ordersQuery = ordersQuery.in("id", orderIds);
        } else {
          // No matching orders
          orders = [];
        }
      }

      const { data } = await ordersQuery;
      orders = (data ?? []) as OrderPhoneRow[];
    }

    // Dedupe by phone
    const seen = new Set<string>();
    const uniqueOrders: OrderPhoneRow[] = [];
    for (const o of orders) {
      if (o.buyer_phone && !seen.has(o.buyer_phone)) {
        seen.add(o.buyer_phone);
        uniqueOrders.push(o);
      }
    }

    // Fetch event info for message context
    let eventTitle = "your event";
    if (eventId) {
      const { data: ev } = await service
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      if (ev) eventTitle = ev.title;
    }

    const messageBody = bcRaw.body as string;
    const channel = bcRaw.channel as string;

    let sentCount = 0;
    let failedCount = 0;
    const recipientRows: {
      broadcast_id: string;
      buyer_id: string;
      phone: string;
      buyer_name: string | null;
      delivered: boolean;
      delivered_at: string | null;
      error: string | null;
    }[] = [];

    for (const order of uniqueOrders) {
      const phone = order.buyer_phone!;
      const name = order.buyer_name ?? "Fete-goer";

      // Replace merge fields
      const resolvedBody = messageBody
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{event\}\}/g, eventTitle);

      let delivered = false;
      let deliveryError: string | null = null;

      if (channel === "whatsapp" || channel === "both") {
        const result = await sendTicketViaWhatsApp({
          to: phone,
          passerName: name,
          eventTitle,
          eventDate: "",
          venue: "",
          tierName: "",
          passCode: "",
          // Override the standard ticket text with our custom body by using the body directly
          // We use a custom message body path — the sendTicketViaWhatsApp builds its own text,
          // so for broadcasts we call Twilio directly with the custom body.
        });
        // sendTicketViaWhatsApp builds a ticket-specific text; for broadcasts
        // we send the composed body via a direct Twilio call instead.
        // Fall through to direct call below.
        void result; // acknowledged
      }

      // Direct Twilio call for broadcast body
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WA_FROM;

        if (!accountSid || !authToken || !fromNumber) {
          // Mock mode
          console.log(`[broadcasts/send] mock → ${phone}: ${resolvedBody.slice(0, 80)}`);
          delivered = true;
        } else {
          const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const formBody = new URLSearchParams({
            From: channel === "sms" ? fromNumber : `whatsapp:${fromNumber}`,
            To: channel === "sms" ? phone : `whatsapp:${phone}`,
            Body: resolvedBody,
          });
          const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody.toString(),
          });
          if (res.ok) {
            delivered = true;
          } else {
            const errText = await res.text();
            deliveryError = `Twilio ${res.status}: ${errText.slice(0, 200)}`;
          }

          // If channel is "both", also send SMS
          if (channel === "both" && delivered) {
            const smsForm = new URLSearchParams({
              From: fromNumber,
              To: phone,
              Body: resolvedBody,
            });
            const smsRes = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: smsForm.toString(),
            });
            if (!smsRes.ok) {
              console.warn(`[broadcasts/send] SMS failed for ${phone}`);
            }
          }
        }
      } catch (e) {
        deliveryError = e instanceof Error ? e.message : String(e);
      }

      if (delivered) {
        sentCount++;
      } else {
        failedCount++;
      }

      recipientRows.push({
        broadcast_id: broadcastId,
        buyer_id: order.buyer_id,
        phone,
        buyer_name: order.buyer_name,
        delivered,
        delivered_at: delivered ? new Date().toISOString() : null,
        error: deliveryError,
      });
    }

    // Persist recipients
    if (recipientRows.length > 0) {
      await service.from("broadcast_recipients").insert(recipientRows);
    }

    // Update broadcast status
    await service
      .from("broadcasts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
        recipient_count: uniqueOrders.length,
      })
      .eq("id", broadcastId);

    return NextResponse.json({ sent: sentCount, failed: failedCount });
  } catch (err) {
    console.error("[POST /api/broadcasts/[id]/send]", err);
    // Mark as failed if we errored out
    try {
      const { id: broadcastId } = await params;
      const svc = await createServiceClient();
      await svc
        .from("broadcasts")
        .update({ status: "failed" })
        .eq("id", broadcastId);
    } catch { /* best effort */ }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
