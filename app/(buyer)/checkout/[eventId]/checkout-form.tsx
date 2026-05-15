"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatTTD } from "@/lib/utils";

export type CheckoutTier = {
  id: string;
  name: string;
  priceCents: number;
  qty: number;
};

export function CheckoutForm({
  eventId,
  tiers,
  subtotalCents,
  feeCents,
  totalCents,
}: {
  eventId: string;
  tiers: CheckoutTier[];
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
}) {
  const router = useRouter();
  const totalQty = useMemo(() => tiers.reduce((n, t) => n + t.qty, 0), [tiers]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card">("bank");
  const [groupMode, setGroupMode] = useState(false);
  const [holders, setHolders] = useState<{ name: string; phone: string }[]>(
    () => Array.from({ length: totalQty }, () => ({ name: "", phone: "" })),
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        eventId,
        items: tiers.map((t) => ({ tierId: t.id, qty: t.qty })),
        buyer: { fullName, phone, email: email || null, sendWhatsapp },
        paymentMethod,
        group: groupMode ? holders : null,
      };
      // TODO(api): POST /api/checkout — handled by another agent. Expects { redirectUrl }.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { redirectUrl?: string };
      if (json.redirectUrl) {
        router.push(json.redirectUrl);
      } else {
        toast.error("Checkout returned no redirect URL");
      }
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateHolder(idx: number, field: "name" | "phone", value: string) {
    setHolders((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Your details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">WhatsApp number</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  placeholder="+1 868 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={(e) => setSendWhatsapp(e.target.checked)}
                className="h-4 w-4"
              />
              Send tickets via WhatsApp
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Buying for a crew?</h2>
                <p className="text-sm text-muted-foreground">Send each person their own QR.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupMode}
                  onChange={(e) => setGroupMode(e.target.checked)}
                  className="h-4 w-4"
                />
                Group mode
              </label>
            </div>
            {groupMode ? (
              <div className="space-y-2">
                {Array.from({ length: totalQty }).map((_, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <Label htmlFor={`h-name-${i}`}>Holder #{i + 1} name</Label>
                      <Input
                        id={`h-name-${i}`}
                        value={holders[i]?.name ?? ""}
                        onChange={(e) => updateHolder(i, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`h-phone-${i}`}>WhatsApp</Label>
                      <Input
                        id={`h-phone-${i}`}
                        type="tel"
                        value={holders[i]?.phone ?? ""}
                        onChange={(e) => updateHolder(i, "phone", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Payment</h2>
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "card")}>
              <TabsList>
                <TabsTrigger value="bank">Bank transfer</TabsTrigger>
                <TabsTrigger value="card">Card</TabsTrigger>
              </TabsList>
              <TabsContent value="bank" className="mt-3 text-sm text-muted-foreground">
                Pay by local bank transfer. After checkout, you&apos;ll get bank details and upload your receipt.
                Tickets release once payment clears.
              </TabsContent>
              <TabsContent value="card" className="mt-3 text-sm text-muted-foreground">
                Pay securely with a card via Stripe. Tickets unlock instantly.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {tiers.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>
                  {t.qty} × {t.name}
                </span>
                <span>{formatTTD(t.qty * t.priceCents)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatTTD(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Platform fee (7.5%)</dt>
              <dd>{formatTTD(feeCents)}</dd>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatTTD(totalCents)}</dd>
            </div>
          </dl>
          <Button
            type="submit"
            disabled={submitting || totalQty === 0}
            className="mt-5 w-full bg-brand-red text-white hover:bg-brand-red/90"
          >
            {submitting ? "Processing…" : `Pay ${formatTTD(totalCents)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            By placing this order you agree to WeFetePass terms.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
