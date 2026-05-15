import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe, stripeConfigured } from "@/lib/payments";
import { env } from "@/lib/env";
import { shortCode } from "@/lib/utils";
import { queuePassDelivery } from "@/lib/whatsapp";

export const runtime = "nodejs";

// Next.js: disable body parser so we can read the raw bytes for Stripe sig verification
export const dynamic = "force-dynamic";

async function generatePassesForOrder(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  orderId: string,
): Promise<void> {
  const { data: order } = await service
    .from("orders")
    .select("id, buyer_id, event_id, status, buyer_phone, buyer_name")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.status === "paid") return; // Already processed (idempotent)

  await service.from("orders").update({ status: "paid" }).eq("id", orderId);

  const { data: items } = await service
    .from("order_items")
    .select("tier_id, quantity")
    .eq("order_id", orderId);

  if (!items?.length) return;

  const passInserts = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: orderId,
      event_id: order.event_id,
      tier_id: item.tier_id,
      holder_name: order.buyer_name ?? null,
      code: shortCode(),
      status: "valid" as const,
    })),
  );

  const { data: passes, error: passError } = await service
    .from("passes")
    .insert(passInserts)
    .select("id");

  if (passError) throw new Error(passError.message);

  if (order.buyer_phone && passes) {
    for (const pass of passes) {
      try {
        await queuePassDelivery(pass.id, order.buyer_phone);
      } catch (waErr) {
        console.error("[stripe webhook] WhatsApp queue failed for pass", pass.id, waErr);
      }
    }
  }
}

export async function POST(request: Request) {
  if (!stripeConfigured) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe>["webhooks"]["constructEvent"] extends (...args: unknown[]) => infer R
    ? R
    : never;

  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  const service = await createServiceClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { metadata?: { order_id?: string } };
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        console.error("[stripe webhook] No order_id in session metadata");
        return NextResponse.json({ received: true });
      }
      await generatePassesForOrder(service, orderId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as { metadata?: { order_id?: string } };
      const orderId = intent.metadata?.order_id;
      if (orderId) {
        await service.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
      }
    }
  } catch (err) {
    console.error("[stripe webhook] Handler error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
