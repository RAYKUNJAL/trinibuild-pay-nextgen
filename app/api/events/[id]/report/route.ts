import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ReportReason =
  | "fake_event"
  | "event_cancelled_no_notice"
  | "no_refund"
  | "misleading_description"
  | "fraud"
  | "other";

const VALID_REASONS = new Set<ReportReason>([
  "fake_event",
  "event_cancelled_no_notice",
  "no_refund",
  "misleading_description",
  "fraud",
  "other",
]);

interface ReportBody {
  reason: ReportReason;
  detail?: string;
  reporterEmail?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    let body: ReportBody;
    try {
      body = (await request.json()) as ReportBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { reason, detail, reporterEmail } = body;

    if (!reason || !VALID_REASONS.has(reason)) {
      return NextResponse.json({ error: "Invalid or missing reason" }, { status: 400 });
    }

    // Resolve reporter identity (optional auth)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const reporterId = user?.id ?? null;

    // Rate limit: one report per reporter_id (or IP) per event
    const serviceClient = await createServiceClient();

    if (reporterId) {
      const { data: existing } = await serviceClient
        .from("event_reports")
        .select("id")
        .eq("event_id", eventId)
        .eq("reporter_id", reporterId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "You have already reported this event." },
          { status: 409 },
        );
      }
    } else {
      // IP-based rate limit for anonymous reporters
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

      if (ip !== "unknown") {
        // We store IP in reporter_email field prefix as a stub pattern
        // A proper implementation would use a rate-limit store (Redis / edge KV)
        // For now: check recent reports from the same email/IP fingerprint
        const fingerprint = `ip:${ip}`;
        const { data: anonExisting } = await serviceClient
          .from("event_reports")
          .select("id")
          .eq("event_id", eventId)
          .eq("reporter_email", fingerprint)
          .maybeSingle();

        if (anonExisting) {
          return NextResponse.json(
            { error: "A report from your network has already been submitted for this event." },
            { status: 409 },
          );
        }
      }
    }

    // Verify the event exists
    const { data: event } = await serviceClient
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Build insert payload
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const insertPayload = {
      event_id: eventId,
      reporter_id: reporterId,
      reason,
      detail: detail ?? null,
      reporter_email: reporterEmail?.trim() || (reporterId ? null : `ip:${ip}`),
      status: "open" as const,
    };

    const { data: report, error: insertError } = await serviceClient
      .from("event_reports")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !report) {
      console.error("[report] insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    return NextResponse.json({ reported: true, reportId: report.id }, { status: 201 });
  } catch (err) {
    console.error("[report] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
