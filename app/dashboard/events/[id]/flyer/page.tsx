import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PageHeader } from "../../../_components/page-header";
import { getCurrentPromoter, getEventForPromoter } from "../../../_lib/queries";
import { createClient } from "@/lib/supabase/server";
import { FlyerStudio, type SavedFlyer } from "./flyer-studio";

export const metadata = { title: "Flyer Studio — WeFetePass" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

export default async function FlyerStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;

  const data = await getEventForPromoter(id, promoter.user.id);
  if (!data) notFound();
  const { event } = data;

  const supabase = await createClient();
  const { data: flyersData } = await raw(supabase)
    .from("flyers")
    .select("id, event_id, prompt, style, aspect_ratio, copy_json, image_url, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const initialFlyers = (flyersData ?? []) as SavedFlyer[];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Flyer Studio — ${event.title}`}
        description="Generate AI flyers tailored to your event's vibe. Pick a style, pick a size, hit generate."
      />
      <FlyerStudio
        eventId={event.id}
        eventTitle={event.title}
        initialFlyers={initialFlyers}
      />
    </div>
  );
}
