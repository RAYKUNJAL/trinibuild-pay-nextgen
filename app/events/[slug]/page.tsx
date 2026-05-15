import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsappCapture } from "@/components/whatsapp-capture";
import { formatDateTime } from "@/lib/utils";
import { env } from "@/lib/env";
import { ShareButton } from "./share-button";
import { TicketTiers } from "./ticket-tiers";

type Params = { slug: string };

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!event) return null;
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", event.id)
    .order("position", { ascending: true });
  const { count: goingCount } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);
  return { event, tiers: tiers ?? [], goingCount: goingCount ?? 0 };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEvent(slug);
  if (!result) return { title: "Event not found" };
  const { event } = result;
  return {
    title: event.title,
    description: event.tagline ?? event.description ?? undefined,
    openGraph: {
      title: event.title,
      description: event.tagline ?? undefined,
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const result = await getEvent(slug);
  if (!result) notFound();
  const { event, tiers, goingCount } = result;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "https://wefetepass.com";
  const shareUrl = `${siteUrl}/events/${event.slug}`;
  const isSoldOut = event.status === "soldout";

  return (
    <>
      <section className="relative">
        <div className="relative h-72 w-full overflow-hidden bg-muted sm:h-96">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 gradient-fete" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="container -mt-24 relative">
          <div className="rounded-xl border border-border/60 bg-background/95 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {isSoldOut ? (
                    <Badge className="bg-brand-red text-white hover:bg-brand-red/90">Sold out</Badge>
                  ) : null}
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" aria-hidden />
                    {goingCount} going
                  </Badge>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>
                {event.tagline ? <p className="text-muted-foreground">{event.tagline}</p> : null}
                <div className="flex flex-wrap gap-4 pt-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" aria-hidden />
                    {formatDateTime(event.starts_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {[event.venue, event.city].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                <ShareButton title={event.title} text={event.tagline ?? undefined} url={shareUrl} />
                {!isSoldOut ? (
                  <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
                    <Link href="#tickets">Get tickets</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="pb-32">
        <Tabs defaultValue="about" className="w-full">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="tickets" id="tickets">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="venue">Venue</TabsTrigger>
            <TabsTrigger value="promoter">Promoter</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="prose prose-neutral max-w-3xl whitespace-pre-line text-base leading-relaxed text-foreground/90">
              {event.description ?? "Details coming soon."}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            {isSoldOut ? (
              <div className="max-w-xl space-y-3">
                <h2 className="font-display text-xl font-semibold">Sold out — join the waitlist</h2>
                <p className="text-sm text-muted-foreground">
                  Drop your number. If seats free up, we&apos;ll WhatsApp you first.
                </p>
                <WhatsappCapture eventCity={event.city} />
              </div>
            ) : tiers.length > 0 ? (
              <TicketTiers
                eventId={event.id}
                tiers={tiers.map((t) => ({
                  id: t.id,
                  name: t.name,
                  description: t.description,
                  priceCents: t.price_cents,
                  quantityRemaining: Math.max(0, t.quantity - t.quantity_sold),
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Tickets on sale soon.</p>
            )}
          </TabsContent>

          <TabsContent value="venue" className="mt-6">
            <div className="max-w-3xl space-y-3">
              <h2 className="font-display text-xl font-semibold">{event.venue}</h2>
              <p className="text-sm text-muted-foreground">{event.city}</p>
              <div className="aspect-video w-full rounded-lg border border-dashed border-border/60 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                Map view coming soon
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promoter" className="mt-6">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display text-xl font-semibold">About the promoter</h2>
              <p className="text-sm text-muted-foreground">
                Verified WeFetePass promoter. Follow their brand page for first access to upcoming drops.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/promoters/${event.organizer_id}`}>View promoter profile</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Section>

      {!isSoldOut ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="container flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{event.title}</div>
              <div className="truncate text-xs text-muted-foreground">{formatDateTime(event.starts_at)}</div>
            </div>
            <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
              <Link href="#tickets">Get tickets</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
