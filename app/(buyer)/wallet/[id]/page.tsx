import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPassToken } from "@/lib/pass-token";
import { qrDataUrl } from "@/lib/qr";
import { PassCard } from "@/components/pass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, cn } from "@/lib/utils";
import { SendWhatsappButton } from "./send-whatsapp-button";

export const metadata: Metadata = { title: "Your pass" };

type Params = { id: string };

type Row = {
  id: string;
  code: string;
  status: "valid" | "used" | "voided";
  used_at: string | null;
  holder_name: string | null;
  event_id: string;
  events: {
    title: string;
    slug: string;
    venue: string;
    city: string;
    starts_at: string;
    cover_image_url: string | null;
  } | null;
  ticket_tiers: { name: string } | null;
};

export default async function PassDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("passes")
    .select(
      "id, code, status, used_at, holder_name, event_id, events:event_id(title, slug, venue, city, starts_at, cover_image_url), ticket_tiers:tier_id(name)",
    )
    .eq("id", id)
    .maybeSingle();

  const pass = data as unknown as Row | null;
  if (!pass || !pass.events) notFound();

  const token = await signPassToken({ passId: pass.id, eventId: pass.event_id, code: pass.code });
  const qrUrl = await qrDataUrl(token);

  const isUsed = pass.status === "used";
  const isVoided = pass.status === "voided";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/wallet">Back to wallet</Link>
        </Button>
      </div>

      <div className={cn("relative", isUsed && "grayscale", isVoided && "opacity-90")}>
        <PassCard
          pass={{
            id: pass.id,
            eventTitle: pass.events.title,
            eventStarts: pass.events.starts_at,
            venue: `${pass.events.venue}, ${pass.events.city}`,
            holderName: pass.holder_name ?? "Guest",
            code: pass.code,
            tierName: pass.ticket_tiers?.name ?? "General",
            status: pass.status,
            qrUrl,
          }}
        />
        {isUsed ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
            <Badge className="bg-foreground text-background text-sm">
              Used{pass.used_at ? ` at ${formatDateTime(pass.used_at)}` : ""}
            </Badge>
          </div>
        ) : null}
        {isVoided ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-brand-red/15">
            <Badge className="bg-brand-red text-white text-sm">Voided</Badge>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Show this at the door. One scan only — keep your screen brightness up.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <SendWhatsappButton passId={pass.id} />
        <Button variant="outline" disabled title="Coming soon">
          Add to Apple Wallet
        </Button>
        <Button variant="outline" disabled title="Coming soon">
          Add to Google Wallet
        </Button>
      </div>
    </div>
  );
}
