import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { llm } from "@/lib/llm/client";
import { FLYER_COPY_SYSTEM } from "@/lib/llm/prompts";
import { generateFlyerImage } from "@/lib/flyer/image-gen";
import { getFlyerStyle, isAspectRatio, type AspectRatioId } from "@/lib/flyer/styles";

// `flyers` table was introduced in migration 0012 — not yet in database.types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (client: unknown) => client as SupabaseClient<any>;

interface GenerateBody {
  eventId?: string;
  style?: string;
  aspectRatio?: string;
  customPrompt?: string;
}

interface FlyerCopy {
  headline: string;
  subhead: string;
  cta: string;
  hashtags: string[];
}

function deterministicCopy(title: string, dateStr: string, venue: string): FlyerCopy {
  return {
    headline: title,
    subhead: `${dateStr} at ${venue}`,
    cta: "Get your ticket on WeFetePass.",
    hashtags: ["#WeFetePass", "#Carnival", "#Fete"],
  };
}

/**
 * Best-effort JSON extraction from an LLM response. Tries:
 *  1) Direct JSON.parse
 *  2) Strip ```json fences and parse
 *  3) Regex-extract the first {...} block
 */
function parseFlyerCopy(text: string): FlyerCopy | null {
  const candidates: string[] = [];
  candidates.push(text.trim());

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch?.[0]) candidates.push(braceMatch[0]);

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c) as Partial<FlyerCopy>;
      if (
        typeof parsed.headline === "string" &&
        typeof parsed.subhead === "string" &&
        typeof parsed.cta === "string"
      ) {
        const hashtags = Array.isArray(parsed.hashtags)
          ? parsed.hashtags.filter((h): h is string => typeof h === "string")
          : [];
        return {
          headline: parsed.headline,
          subhead: parsed.subhead,
          cta: parsed.cta,
          hashtags,
        };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventId, style, customPrompt } = body;
  const aspectRatioRaw = body.aspectRatio ?? "1:1";

  if (!eventId || !style) {
    return NextResponse.json({ error: "eventId and style are required" }, { status: 400 });
  }
  if (!isAspectRatio(aspectRatioRaw)) {
    return NextResponse.json({ error: "Invalid aspect ratio" }, { status: 400 });
  }
  const aspectRatio: AspectRatioId = aspectRatioRaw;

  const preset = getFlyerStyle(style);
  if (!preset) {
    return NextResponse.json({ error: "Unknown style" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Authorize: must own the event.
  const { data: event } = await supabase
    .from("events")
    .select("id, title, tagline, venue, city, starts_at, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const startsAt = event.starts_at ? new Date(event.starts_at) : null;
  const dateStr = startsAt
    ? startsAt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBA";
  const venueStr = [event.venue, event.city].filter(Boolean).join(", ") || "TBA";

  // 1) Copy via LLM (with graceful fallback)
  let copy: FlyerCopy = deterministicCopy(event.title, dateStr, venueStr);
  const llmPrompt = `Event: ${event.title}. Date: ${dateStr}. Venue: ${venueStr}. Vibe: ${preset.label} — ${preset.description}. Generate flyer copy as JSON with keys: headline (max 8 words), subhead (max 14 words), cta (max 8 words), hashtags (array of 3-5 strings starting with #). Respond with JSON only, no prose.`;

  const llmResult = await llm.text({
    prompt: llmPrompt,
    system: FLYER_COPY_SYSTEM,
    model: "haiku",
    maxTokens: 600,
  });

  if (llmResult && llmResult.text) {
    const parsed = parseFlyerCopy(llmResult.text);
    if (parsed) copy = parsed;
  }

  // 2) Image via Replicate (graceful fallback when REPLICATE_API_TOKEN missing)
  const baseSubject = customPrompt?.trim()
    ? customPrompt.trim()
    : `${event.title}${event.tagline ? " — " + event.tagline : ""}`;
  const imagePrompt = `${baseSubject} — ${preset.promptSuffix} — flyer poster design, no text`;

  const { imageUrl } = await generateFlyerImage(imagePrompt, aspectRatio);

  // 3) Persist
  const { data: inserted, error: insertErr } = await raw(supabase)
    .from("flyers")
    .insert({
      event_id: event.id,
      created_by: user.id,
      prompt: imagePrompt,
      style: preset.id,
      aspect_ratio: aspectRatio,
      copy_json: copy,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: "Failed to save flyer" }, { status: 500 });
  }

  return NextResponse.json({
    id: inserted?.id ?? null,
    copy,
    imageUrl,
    style: preset.id,
    aspectRatio,
  });
}
