import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CheckoutForm, type CheckoutTier } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

type Params = { eventId: string };
type SP = { tiers?: string };

function parseTiersParam(input: string | undefined): Map<string, number> {
  const out = new Map<string, number>();
  if (!input) return out;
  for (const chunk of input.split(",")) {
    const [tierId, qtyStr] = chunk.split(":");
    const qty = parseInt(qtyStr ?? "0", 10);
    if (tierId && qty > 0) out.set(tierId, qty);
  }
  return out;
}

const FEE_BPS = 750; // 7.5%

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SP>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, starts_at, venue, city, status")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) notFound();

  const { data: tiersData } = await supabase
    .from("ticket_tiers")
    .select("id, name, price_cents, position")
    .eq("event_id", event.id)
    .order("position", { ascending: true });

  const preselect = parseTiersParam(sp.tiers);
  const tiers: CheckoutTier[] = (tiersData ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      priceCents: t.price_cents,
      qty: preselect.get(t.id) ?? 0,
    }))
    .filter((t) => t.qty > 0);

  const subtotalCents = tiers.reduce((s, t) => s + t.qty * t.priceCents, 0);
  const feeCents = Math.round((subtotalCents * FEE_BPS) / 10000);
  const totalCents = subtotalCents + feeCents;

  return (
    <>
      <PageHeader
        title={`Checkout — ${event.title}`}
        description="Review your tickets, choose how to pay, and lock in your spot."
      />
      <div className="mt-6">
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tickets selected. Head back to the event page and choose your tiers.
          </p>
        ) : (
          <CheckoutForm
            eventId={event.id}
            tiers={tiers}
            subtotalCents={subtotalCents}
            feeCents={feeCents}
            totalCents={totalCents}
          />
        )}
      </div>
    </>
  );
}
