import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DashboardEvent = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "published" | "soldout" | "cancelled";
  venue: string;
  city: string;
  cover_image_url: string | null;
  gate_open_at: string | null;
  tagline: string | null;
};

export async function getCurrentPromoter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();
  const brand = (user.user_metadata?.brand_name as string | undefined) ?? null;
  return { user, profile, brandName: brand ?? profile?.full_name ?? "Your brand" };
}

export async function listPromoterEvents(organizerId: string): Promise<DashboardEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, tagline, starts_at, ends_at, status, venue, city, cover_image_url, gate_open_at",
    )
    .eq("organizer_id", organizerId)
    .order("starts_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as DashboardEvent[];
}

export async function getEventForPromoter(eventId: string, organizerId: string) {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .maybeSingle();
  if (!event) return null;
  const { data: tiers } = await supabase
    .from("ticket_tiers")
    .select("*")
    .eq("event_id", eventId)
    .order("position", { ascending: true });
  return { event, tiers: tiers ?? [] };
}

export function computeReadiness(event: {
  cover_image_url: string | null;
  tagline: string | null;
  description?: string | null;
  status: string;
  gate_open_at: string | null;
}) {
  const checks = [
    { label: "Cover image uploaded", done: !!event.cover_image_url },
    { label: "Tagline added", done: !!event.tagline },
    { label: "Description filled", done: !!event.description },
    { label: "Gate time set", done: !!event.gate_open_at },
    { label: "Event published", done: event.status === "published" },
  ];
  const done = checks.filter((c) => c.done).length;
  const score = Math.round((done / checks.length) * 100);
  return { score, checks };
}
