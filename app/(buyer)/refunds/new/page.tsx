import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NewRefundForm } from "./_form";

export const metadata: Metadata = { title: "Request a Refund — WeFetePass" };

type SearchParams = { orderId?: string };

type Order = {
  id: string;
  total_cents: number;
  status: string;
  buyer_id: string;
  event_id: string;
  events: { title: string; starts_at: string; venue: string } | null;
};

export default async function NewRefundPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/orders");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=/refunds/new?orderId=${orderId}`);
  }

  const { data: orderData } = await supabase
    .from("orders")
    .select(
      "id, total_cents, status, buyer_id, event_id, events:event_id(title, starts_at, venue)",
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = orderData as unknown as Order | null;

  if (!order || order.buyer_id !== user.id) {
    notFound();
  }

  if (order.status !== "paid") {
    redirect(`/orders/${orderId}`);
  }

  return (
    <>
      <PageHeader
        title="Request a Refund"
        description={`For: ${order.events?.title ?? "your order"}`}
      />
      <div className="mt-6 max-w-xl">
        <NewRefundForm order={order} />
      </div>
    </>
  );
}
