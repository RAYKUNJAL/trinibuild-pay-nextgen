import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type Params = { id: string };

interface SendMessageBody {
  body: string;
  attachments?: string[];
}

async function getDisputeAndVerifyAccess(
  disputeId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: disputeData, error } = await supabase
    .from("disputes")
    .select("id, buyer_id, event_id")
    .eq("id", disputeId)
    .maybeSingle();

  if (error || !disputeData) return { dispute: null, role: null };

  const dispute = disputeData as {
    id: string;
    buyer_id: string;
    event_id: string;
  };

  if (dispute.buyer_id === userId) {
    return { dispute, role: "buyer" as const };
  }

  // Check if organizer
  const { data: eventData } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", dispute.event_id)
    .maybeSingle();

  const isOrganizer =
    (eventData as { organizer_id: string } | null)?.organizer_id === userId;

  if (isOrganizer) {
    return { dispute, role: "organizer" as const };
  }

  return { dispute: null, role: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dispute } = await getDisputeAndVerifyAccess(id, user.id, supabase);
    if (!dispute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages, error: msgError } = await supabase
      .from("dispute_messages")
      .select("id, sender_id, sender_role, body, attachments, created_at")
      .eq("dispute_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch (err) {
    console.error("[GET /api/disputes/[id]/messages]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dispute, role } = await getDisputeAndVerifyAccess(id, user.id, supabase);
    if (!dispute || !role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: SendMessageBody = await request.json();
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const service = await createServiceClient();
    const { data: message, error: insertError } = await service
      .from("dispute_messages")
      .insert({
        dispute_id: id,
        sender_id: user.id,
        sender_role: role,
        body: body.body.trim(),
        attachments: body.attachments ?? [],
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/disputes/[id]/messages]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
