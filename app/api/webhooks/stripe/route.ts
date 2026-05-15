import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/payments";
import { env, stripeConfigured } from "@/lib/env";
import { shortCode } from "@/lib/utils";
import { queuePassDelivery } from "@/lib/whatsapp";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  "id" | "buyer_id" | "event_id" | "status" | "buyer_phone" | "buyer_name"
>;
type OrderItemRow = Pick<Database["public"]["Tables"]["order_items"]["Row"], "tier_id" | "quantity">;
type PassInsert = Database["public"]["Tables"]["passes"]["Insert"];

async function generatePassesForOrder(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  orderId: string,
): Promise<void> {
  const { data: orderRaw } = await service
    .from("orders")
    .select("id, buyer_id, event_id, status, buyer_phone, buyer_name")
    .eq("id", orderId)
    .single();

  if (!orderRaw) throw new Error(`Order ${orderId} not found`);
  const order = orderRaw as OrderRow;

  if (order.status === "paid") return;

  await service.from("orders").update({ status: "paid" }).eq("id", orderId);

  const { data: itemsRaw } = await service
    .from("order_items")
    .select("tier_id, quantity")
    .eq("order_id", orderId);

  const items = (itemsRaw ?? []) as OrderItemRow[];
  if (!items.length) return;

  const passInserts: PassInsert[] = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: orderId,
      event_id: order.event_id,
      tier_id: item.tier_id,
      holder_name: order.buyer_name ?? null,
      code: shortCode(),
      status: "valid" as const,
    })),
  );

  const { data: passesRaw, error: passError } = await service
    .from("passes")
    .insert(passInserts)
    .select("id");

  if (passError) throw new Error(passError.message);

  const passes = (passesRaw ?? []) as { id: string }[];

  if (order.buyer_phone) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

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
