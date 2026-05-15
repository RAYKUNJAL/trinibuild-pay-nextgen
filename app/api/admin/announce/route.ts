import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface AnnounceBody {
  title?: string;
  body?: string;
  target?: string;
  channel?: string;
}

async function readBody(request: Request): Promise<AnnounceBody> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await request.json()) as AnnounceBody;
  }
  const form = await request.formData();
  return {
    title: (form.get("title") as string) ?? "",
    body: (form.get("body") as string) ?? "",
    target: (form.get("target") as string) ?? "all",
    channel: (form.get("channel") as string) ?? "whatsapp",
  };
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin();
    const { title, body, target, channel } = await readBody(request);

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body required" }, { status: 422 });
    }
    const resolvedChannel = channel === "sms" || channel === "both" ? channel : "whatsapp";
    const resolvedTarget = target?.trim() || "all";

    const svc = await createServiceClient();

    // Estimate recipient count by audience.
    let recipientQuery = raw(svc).from("profiles").select("id", { count: "exact", head: true });
    if (resolvedTarget === "promoters") {
      recipientQuery = recipientQuery.eq("role", "organizer");
    } else if (resolvedTarget === "attendees") {
      recipientQuery = recipientQuery.eq("role", "attendee");
    }
    // Island targeting is enforced downstream by the broadcast worker — we just tag it.
    const { count } = await recipientQuery;

    // Prefix the body with [Admin] so it's clearly a platform announcement.
    const taggedBody = `[Admin] ${body.trim()}`;

    const { data: broadcast, error } = await raw(svc)
      .from("broadcasts")
      .insert({
        organizer_id: user.id,
        event_id: null,
        tier_ids: [],
        body: taggedBody,
        subject: title.trim(),
        channel: resolvedChannel,
        status: "draft",
        recipient_count: count ?? 0,
        scheduled_for: null,
        metadata: {
          admin_announcement: true,
          target: resolvedTarget,
        },
      })
      .select("id, recipient_count")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const b = broadcast as { id: string; recipient_count: number | null };

    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/announcements?ok=1", request.url), 303);
    }
    return NextResponse.json({
      broadcastId: b.id,
      recipientCount: b.recipient_count ?? 0,
    });
  } catch (err) {
    console.error("[admin/announce]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
