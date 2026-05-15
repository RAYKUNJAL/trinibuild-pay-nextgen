import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "../../../_components/page-header";
import { EventForm } from "../../_components/event-form";
import { getCurrentPromoter, getEventForPromoter } from "../../../_lib/queries";

export const metadata = { title: "Edit event — WeFetePass" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;
  const data = await getEventForPromoter(id, promoter.user.id);
  if (!data) notFound();
  const { event, tiers } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        description="Edit event details, ticket tiers, and publishing status."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/events/${event.id}/analytics`}>Analytics</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/events/${event.slug}`}>View public page</Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-6">
          <EventForm
            mode="edit"
            initial={{
              id: event.id,
              title: event.title,
              tagline: event.tagline,
              description: event.description,
              venue: event.venue,
              city: event.city,
              starts_at: event.starts_at,
              ends_at: event.ends_at,
              gate_open_at: event.gate_open_at,
              cover_image_url: event.cover_image_url,
              tiers: tiers.map((t) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                price_cents: t.price_cents,
                quantity: t.quantity,
                sales_start_at: t.sales_start_at,
                sales_end_at: t.sales_end_at,
              })),
            }}
          />
        </TabsContent>
        <TabsContent value="tiers" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Tiers live inside the Details tab — scroll to the Ticket tiers card to edit them.
          </p>
        </TabsContent>
        <TabsContent value="publishing" className="mt-6">
          <PublishingTab eventId={event.id} status={event.status} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Gate time and scan window controls live in the Details tab.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PublishingTab({ eventId, status }: { eventId: string; status: string }) {
  const transitions: Array<{ to: string; label: string; tone: string }> = [
    { to: "draft", label: "Move to draft", tone: "outline" },
    { to: "published", label: "Publish", tone: "primary" },
    { to: "soldout", label: "Mark sold out", tone: "outline" },
    { to: "cancelled", label: "Cancel event", tone: "destructive" },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current status: <span className="font-medium text-foreground">{status}</span>
      </p>
      <form
        method="POST"
        action={`/api/events/${eventId}/status`}
        className="flex flex-wrap gap-2"
      >
        {transitions.map((t) => (
          <button
            key={t.to}
            name="status"
            value={t.to}
            type="submit"
            disabled={t.to === status}
            className="rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </form>
    </div>
  );
}
