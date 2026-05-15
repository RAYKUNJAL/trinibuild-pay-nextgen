import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cast helper — used for tables not yet in database.types.ts (added in migration 0006)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface BroadcastRow {
  id: string;
  organizer_id: string;
  event_id: string | null;
  tier_ids: string[] | null;
  body: string;
  channel: string;
  status: string;
}

interface OrderRow {
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
    const { data: bcRaw, error: bcErr } = await raw(supabase)
      .from("broadcasts")
      .select("id, organizer_id, event_id, tier_ids, body, channel, status")
      .eq("id", broadcastId)
      .eq("organizer_id", user.id)
      .maybeSingle();

    if (bcErr || !bcRaw) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const bc = bcRaw as BroadcastRow;

    if (bc.status === "sent" || bc.status === "sending") {
      return NextResponse.json({ error: "Broadcast already sent or sending" }, { status: 409 });
    }

    const service = await createServiceClient();

    // Mark as sending
    await raw(service)
      .from("broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcastId);

    // Gather audience
    const eventId = bc.event_id;
    const tierIds = bc.tier_ids ?? [];

    let orders: OrderRow[] = [];

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
          const { data } = await ordersQuery;
          orders = (data ?? []) as OrderRow[];
        }
        // else orders stays empty
      } else {
        const { data } = await ordersQuery;
        orders = (data ?? []) as OrderRow[];
      }
    }

    // Dedupe by phone
    const seen = new Set<string>();
    const uniqueOrders: OrderRow[] = [];
    for (const o of orders) {
      if (o.buyer_phone && !seen.has(o.buyer_phone)) {
        seen.add(o.buyer_phone);
        uniqueOrders.push(o);
      }
    }

    // Fetch event info for merge fields
    let eventTitle = "your event";
    if (eventId) {
      const { data: ev } = await service
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      if (ev) eventTitle = (ev as { title: string }).title;
    }

    const messageBody = bc.body;
    const channel = bc.channel;

    let sentCount = 0;
    let failedCount = 0;

    interface RecipientInsert {
      broadcast_id: string;
      buyer_id: string;
      phone: string;
      buyer_name: string | null;
      delivered: boolean;
      delivered_at: string | null;
      error: string | null;
    }

    const recipientRows: RecipientInsert[] = [];

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WA_FROM;
    const twilioConfigured = !!(accountSid && authToken && fromNumber);

    for (const order of uniqueOrders) {
      const phone = order.buyer_phone!;
      const name = order.buyer_name ?? "Fete-goer";

      const resolvedBody = messageBody
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{event\}\}/g, eventTitle);

      let delivered = false;
      let deliveryError: string | null = null;

      if (!twilioConfigured) {
        // Mock mode
        console.log(`[broadcasts/send] mock → ${phone}: ${resolvedBody.slice(0, 80)}`);
        delivered = true;
      } else {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

          const sendVia = async (from: string, to: string) => {
            const formBody = new URLSearchParams({ From: from, To: to, Body: resolvedBody });
            const res = await fetch(twilioUrl, {
              method: "POST",
              headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: formBody.toString(),
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Twilio ${res.status}: ${errText.slice(0, 200)}`);
            }
          };

          if (channel === "whatsapp" || channel === "both") {
            await sendVia(`whatsapp:${fromNumber}`, `whatsapp:${phone}`);
            delivered = true;
          }
          if (channel === "sms" || channel === "both") {
            await sendVia(fromNumber, phone);
            delivered = true;
          }
        } catch (e) {
          deliveryError = e instanceof Error ? e.message : String(e);
        }
      }

      if (delivered) sentCount++;
      else failedCount++;

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
      await raw(service).from("broadcast_recipients").insert(recipientRows);
    }

    // Update broadcast status
    await raw(service)
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
    try {
      const { id: broadcastId } = await params;
      const svc = await createServiceClient();
      await raw(svc).from("broadcasts").update({ status: "failed" }).eq("id", broadcastId);
    } catch { /* best effort */ }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
