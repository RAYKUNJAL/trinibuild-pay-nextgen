import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

interface GroupMemberInput {
  name: string;
  phone: string;
}

interface CreateGroupBody {
  orderId: string;
  members: GroupMemberInput[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateGroupBody = await request.json();
    const { orderId, members } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }
    if (!members?.length) {
      return NextResponse.json({ error: "At least one member is required" }, { status: 400 });
    }

    const { data: orderRaw, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, event_id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRaw as Pick<OrderRow, "id" | "buyer_id" | "event_id" | "status">;

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: not your order" }, { status: 403 });
    }
    if (!["pending", "paid"].includes(order.status)) {
      return NextResponse.json({ error: `Cannot create group for order with status: ${order.status}` }, { status: 409 });
    }

    const service = await createServiceClient();

    const { data: existingRaw } = await service
      .from("group_orders")
      .select("id, share_token")
      .eq("order_id", orderId)
      .single();

    if (existingRaw) {
      const existing = existingRaw as { id: string; share_token: string };
      const shareLink = `${env.NEXT_PUBLIC_SITE_URL}/groups/${existing.share_token}`;
      return NextResponse.json({ groupId: existing.id, shareLink, alreadyExists: true });
    }

    const { data: groupOrderRaw, error: groupError } = await service
      .from("group_orders")
      .insert({ order_id: orderId, organizer_buyer_id: user.id })
      .select("id, share_token")
      .single();

    if (groupError || !groupOrderRaw) {
      return NextResponse.json({ error: groupError?.message ?? "Failed to create group" }, { status: 500 });
    }

    const groupOrder = groupOrderRaw as { id: string; share_token: string };

    const memberInserts = members.map((m) => ({
      group_id: groupOrder.id,
      buyer_phone: m.phone,
      buyer_name: m.name,
      paid: false,
    }));

    const { error: membersError } = await service.from("group_members").insert(memberInserts);
    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const shareLink = `${env.NEXT_PUBLIC_SITE_URL}/groups/${groupOrder.share_token}`;

    return NextResponse.json({ groupId: groupOrder.id, shareLink }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/groups]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
