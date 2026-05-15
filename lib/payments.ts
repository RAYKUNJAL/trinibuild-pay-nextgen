import "server-only";
import Stripe from "stripe";
import { env, stripeConfigured } from "@/lib/env";

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!stripeConfigured) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });
  return stripeClient;
}

export type CheckoutLineItem = {
  name: string;
  unitAmountCents: number;
  quantity: number;
};

export type CheckoutInit = {
  orderId: string;
  lineItems: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export type CheckoutResult = {
  provider: "stripe" | "mock";
  url: string;
  reference: string;
};

export async function startCheckout(input: CheckoutInit): Promise<CheckoutResult> {
  if (!stripeConfigured) {
    // Mock provider: route the user through our /api/checkout/mock-complete endpoint
    const url = new URL(input.successUrl);
    url.searchParams.set("mock", "1");
    return { provider: "mock", url: url.toString(), reference: `mock_${input.orderId}` };
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.orderId,
    metadata: { order_id: input.orderId },
    line_items: input.lineItems.map((li) => ({
      quantity: li.quantity,
      price_data: {
        currency: "ttd",
        unit_amount: li.unitAmountCents,
        product_data: { name: li.name },
      },
    })),
  });

  return { provider: "stripe", url: session.url!, reference: session.id };
}
