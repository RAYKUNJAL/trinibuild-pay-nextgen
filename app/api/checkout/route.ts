import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { startCheckout } from "@/lib/payments";
import { env } from "@/lib/env";
import { shortCode } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type TierRow = Database["public"]["Tables"]["ticket_tiers"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

interface TierSelection {
  tierId: string;
  qty: number;
}

interface GroupMember {
  name: string;
  phone: string;
}

interface CheckoutBody {
  eventId: string;
  tiers: TierSelection[];
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  sendWhatsApp?: boolean;
  groupMembers?: GroupMember[];
}

const FEE_RATE = 0.075;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CheckoutBody = await request.json();
    const { eventId, tiers, buyerName, buyerPhone, buyerEmail, groupMembers } = body;

    if (!eventId || !tiers?.length || !buyerName || !buyerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch all requested tiers
    const tierIds = tiers.map((t) => t.tierId);
    const { data: tierRowsRaw, error: tierError } = await supabase
      .from("ticket_tiers")
      .select("id, name, price_cents, quantity, quantity_sold, event_id")
      .in("id", tierIds);

    if (tierError) {
      return NextResponse.json({ error: tierError.message }, { status: 500 });
    }

    const tierRows = (tierRowsRaw ?? []) as Pick<TierRow, "id" | "name" | "price_cents" | "quantity" | "quantity_sold" | "event_id">[];

    if (tierRows.length !== tierIds.length) {
      return NextResponse.json({ error: "One or more tiers not found" }, { status: 404 });
    }

    // Validate all tiers belong to the same event
    for (const tier of tierRows) {
      if (tier.event_id !== eventId) {
        return NextResponse.json({ error: `Tier ${tier.id} does not belong to event ${eventId}` }, { status: 400 });
      }
    }

    // Validate availability
    for (const sel of tiers) {
      const tier = tierRows.find((t) => t.id === sel.tierId)!;
      const available = tier.quantity - tier.quantity_sold;
      if (sel.qty < 1) {
        return NextResponse.json({ error: `Quantity must be at least 1 for tier ${tier.name}` }, { status: 400 });
      }
      if (sel.qty > available) {
        return NextResponse.json(
          { error: `Only ${available} tickets remaining for tier ${tier.name}` },
          { status: 409 },
        );
      }
    }

    // Calculate totals
    let subtotalCents = 0;
    for (const sel of tiers) {
      const tier = tierRows.find((t) => t.id === sel.tierId)!;
      subtotalCents += tier.price_cents * sel.qty;
    }
    const feeCents = Math.round(subtotalCents * FEE_RATE);
    const totalCents = subtotalCents + feeCents;

    // Use service client for writes (bypasses RLS for atomic operations)
    const service = await createServiceClient();

    // Insert order
    const orderInsert: OrderInsert = {
      buyer_id: user.id,
      event_id: eventId,
      subtotal_cents: subtotalCents,
      fee_cents: feeCents,
      total_cents: totalCents,
      currency: "TTD",
      status: "pending",
      payment_provider: "mock",
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      buyer_email: buyerEmail ?? null,
    };

    const { data: orderRaw, error: orderError } = await service
      .from("orders")
      .insert(orderInsert)
      .select("id")
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: orderError?.message ?? "Failed to create order" }, { status: 500 });
    }

    const order = orderRaw as { id: string };

    // Insert order items
    const itemInserts: OrderItemInsert[] = tiers.map((sel) => {
      const tier = tierRows.find((t) => t.id === sel.tierId)!;
      return {
        order_id: order.id,
        tier_id: sel.tierId,
        quantity: sel.qty,
        unit_price_cents: tier.price_cents,
      };
    });

    const { error: itemsError } = await service.from("order_items").insert(itemInserts);
    if (itemsError) {
      await service.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Reserve quantities atomically via RPC
    for (const sel of tiers) {
      const { error: incrError } = await (service.rpc as Function)(
        "increment_tier_quantity_sold",
        { tier_id: sel.tierId, qty: sel.qty },
      );
      if (incrError) {
        await service.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        const prevIdx = tiers.indexOf(sel);
        for (let i = 0; i < prevIdx; i++) {
          await (service.rpc as Function)("increment_tier_quantity_sold", {
            tier_id: tiers[i].tierId,
            qty: -tiers[i].qty,
          });
        }
        const errMsg = (incrError as { message?: string }).message ?? "Quantity reservation failed";
        return NextResponse.json({ error: errMsg }, { status: 409 });
      }
    }

    // Handle group order
    if (groupMembers?.length) {
      const { data: groupOrderRaw, error: groupError } = await service
        .from("group_orders")
        .insert({ order_id: order.id, organizer_buyer_id: user.id })
        .select("id")
        .single();

      if (groupError || !groupOrderRaw) {
        console.error("Group order creation failed:", groupError?.message);
      } else {
        const groupOrder = groupOrderRaw as { id: string };
        const memberInserts = groupMembers.map((m) => ({
          group_id: groupOrder.id,
          buyer_phone: m.phone,
          buyer_name: m.name,
          paid: false,
        }));
        const { error: membersError } = await service.from("group_members").insert(memberInserts);
        if (membersError) {
          console.error("Group members insertion failed:", membersError.message);
        }
      }
    }

    // Build checkout line items
    const lineItems = tiers.map((sel) => {
      const tier = tierRows.find((t) => t.id === sel.tierId)!;
      return { name: tier.name, unitAmountCents: tier.price_cents, quantity: sel.qty };
    });
    lineItems.push({ name: "WeFetePass Platform Fee (7.5%)", unitAmountCents: feeCents, quantity: 1 });

    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    let checkoutResult;
    try {
      checkoutResult = await startCheckout({
        orderId: order.id,
        lineItems,
        successUrl: `${siteUrl}/checkout/${order.id}/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${siteUrl}/events/${eventId}`,
        customerEmail: buyerEmail,
      });
    } catch (checkoutError) {
      await service.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      for (const sel of tiers) {
        await (service.rpc as Function)("increment_tier_quantity_sold", {
          tier_id: sel.tierId,
          qty: -sel.qty,
        });
      }
      const msg = checkoutError instanceof Error ? checkoutError.message : "Checkout failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    await service
      .from("orders")
      .update({ payment_ref: checkoutResult.reference, payment_provider: checkoutResult.provider })
      .eq("id", order.id);

    return NextResponse.json(
      { orderId: order.id, redirectUrl: checkoutResult.url, provider: checkoutResult.provider },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/checkout]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
