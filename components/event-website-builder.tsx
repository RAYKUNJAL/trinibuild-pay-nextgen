"use client";

import React, { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  EventWebsitePreview,
  type EventWebsite,
  type Event,
  type TicketTier,
  type WebsiteTemplate,
} from "@/components/event-website-preview";

// ─── Types ────────────────────────────────────────────────────────────────────

type SponsorEntry = { name: string; logo_url: string; url: string };
type FaqEntry = { question: string; answer: string };

interface BuilderState {
  template: WebsiteTemplate;
  headline: string;
  subheadline: string;
  description_html: string;
  lineup: string[];
  dress_code: string;
  video_url: string;
  gallery_image_urls: string[];
  sponsors: SponsorEntry[];
  faq: FaqEntry[];
  venue_map_url: string;
  venue_directions: string;
  contact_whatsapp: string;
  contact_email: string;
  meta_pixel_id: string;
  google_analytics_id: string;
  custom_slug: string;
  status: "draft" | "published" | "unpublished";
}

export interface BuilderProps {
  eventId: string;
  event: { title: string; slug: string; cover_image_url: string | null };
  initialWebsite: EventWebsite | null;
  tiers: TicketTier[];
}

// ─── Template previews ────────────────────────────────────────────────────────

const TEMPLATES: Array<{
  id: WebsiteTemplate;
  label: string;
  preview: string;
  dot: string;
}> = [
  { id: "midnight_mas", label: "Midnight Mas", preview: "bg-gradient-to-br from-[#1a0e00] to-[#030303]", dot: "bg-[#d8ab5b]" },
  { id: "carnival_vibes", label: "Carnival Vibes", preview: "bg-gradient-to-br from-[#2d0000] to-[#0d0000]", dot: "bg-[#e84141]" },
  { id: "beach_party", label: "Beach Party", preview: "bg-gradient-to-br from-[#012d2d] to-[#011a1a]", dot: "bg-[#2eccc7]" },
  { id: "club_night", label: "Club Night", preview: "bg-gradient-to-br from-[#12002a] to-[#06000f]", dot: "bg-[#c56aff]" },
  { id: "road_march", label: "Road March", preview: "bg-gradient-to-br from-[#1a0000] to-[#050505]", dot: "bg-[#ff3b3b]" },
];

type Step =
  | "template"
  | "content"
  | "gallery"
  | "faq"
  | "venue"
  | "sponsors"
  | "tracking"
  | "publish";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "template", label: "Template" },
  { id: "content", label: "Content" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
  { id: "venue", label: "Venue" },
  { id: "sponsors", label: "Sponsors" },
  { id: "tracking", label: "Tracking" },
  { id: "publish", label: "Publish" },
];

// ─── Helper to turn builder state into EventWebsite shape ─────────────────────

function stateToWebsite(
  s: BuilderState,
  base: EventWebsite | null,
  eventId: string,
  organizerId: string,
): EventWebsite {
  const now = new Date().toISOString();
  return {
    id: base?.id ?? "",
    event_id: eventId,
    organizer_id: organizerId,
    template: s.template,
    custom_slug: s.custom_slug || null,
    headline: s.headline || null,
    subheadline: s.subheadline || null,
    description_html: s.description_html || null,
    gallery_image_urls: s.gallery_image_urls.filter(Boolean),
    video_url: s.video_url || null,
    dress_code: s.dress_code || null,
    lineup: s.lineup.filter(Boolean),
    sponsors: s.sponsors,
    faq: s.faq,
    venue_map_url: s.venue_map_url || null,
    venue_directions: s.venue_directions || null,
    contact_whatsapp: s.contact_whatsapp || null,
    contact_email: s.contact_email || null,
    meta_pixel_id: s.meta_pixel_id || null,
    google_analytics_id: s.google_analytics_id || null,
    custom_css: base?.custom_css ?? null,
    status: s.status,
    published_at: base?.published_at ?? null,
    created_at: base?.created_at ?? now,
    updated_at: now,
  };
}

function initialState(w: EventWebsite | null): BuilderState {
  return {
    template: w?.template ?? "midnight_mas",
    headline: w?.headline ?? "",
    subheadline: w?.subheadline ?? "",
    description_html: w?.description_html ?? "",
    lineup: w?.lineup ?? [],
    dress_code: w?.dress_code ?? "",
    video_url: w?.video_url ?? "",
    gallery_image_urls: w && w.gallery_image_urls.length > 0 ? w.gallery_image_urls : [""],
    sponsors:
      w && w.sponsors.length > 0
        ? w.sponsors
        : [{ name: "", logo_url: "", url: "" }],
    faq:
      w && w.faq.length > 0
        ? w.faq
        : [{ question: "", answer: "" }],
    venue_map_url: w?.venue_map_url ?? "",
    venue_directions: w?.venue_directions ?? "",
    contact_whatsapp: w?.contact_whatsapp ?? "",
    contact_email: w?.contact_email ?? "",
    meta_pixel_id: w?.meta_pixel_id ?? "",
    google_analytics_id: w?.google_analytics_id ?? "",
    custom_slug: w?.custom_slug ?? "",
    status: w?.status ?? "draft",
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventWebsiteBuilder({
  eventId,
  event,
  initialWebsite,
  tiers,
}: BuilderProps) {
  const [step, setStep] = useState<Step>("template");
  const [state, setState] = useState<BuilderState>(() => initialState(initialWebsite));
  const [savedWebsite, setSavedWebsite] = useState<EventWebsite | null>(initialWebsite);
  const [isSaving, startSaving] = useTransition();
  const [lineupInput, setLineupInput] = useState("");

  // Debounced preview state
  const [previewState, setPreviewState] = useState<BuilderState>(state);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = useCallback((patch: Partial<BuilderState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setPreviewState(next), 300);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(
    (publish: boolean) => {
      startSaving(async () => {
        const method = savedWebsite ? "PUT" : "POST";
        const payload = {
          ...state,
          status: publish ? "published" : state.status === "published" ? "published" : "draft",
          lineup: state.lineup.filter(Boolean),
          gallery_image_urls: state.gallery_image_urls.filter(Boolean),
        };

        try {
          const res = await fetch(`/api/events/${eventId}/website`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = (await res.json()) as { website?: EventWebsite; error?: string };
          if (!res.ok) throw new Error(json.error ?? "Save failed");
          if (json.website) {
            setSavedWebsite(json.website);
            setState((prev) => ({ ...prev, status: json.website!.status }));
            toast.success(publish ? "Website published!" : "Draft saved.");
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong.");
        }
      });
    },
    [eventId, savedWebsite, state],
  );

  // ── Derived preview ───────────────────────────────────────────────────────

  const previewWebsite = stateToWebsite(
    previewState,
    savedWebsite,
    eventId,
    savedWebsite?.organizer_id ?? "",
  );

  const previewEvent: Event = {
    id: eventId,
    title: event.title,
    slug: event.slug,
    tagline: null,
    description: null,
    venue: "Venue",
    city: "Trinidad",
    starts_at: new Date().toISOString(),
    ends_at: null,
    cover_image_url: event.cover_image_url,
    gate_open_at: null,
    status: "published",
    organizer_id: savedWebsite?.organizer_id ?? "",
    capacity: null,
  };

  const effectiveSlug = state.custom_slug || event.slug;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-xl border border-border/60">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-card">
        {/* Step nav */}
        <nav className="p-3">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <Separator />

        {/* Quick save in sidebar */}
        <div className="p-3 space-y-2 mt-auto">
          {isSaving ? (
            <p className="text-center text-xs text-muted-foreground">Saving…</p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            className="w-full bg-[#d8ab5b] text-black hover:bg-[#c79a52]"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            Publish
          </Button>
        </div>
      </aside>

      {/* ── Settings panel ──────────────────────────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-background">
        <div className="p-5 space-y-5">
          {/* ── TEMPLATE ────────────────────────────────────────────────────── */}
          {step === "template" && (
            <>
              <h3 className="font-display text-base font-semibold">Choose Template</h3>
              <div className="space-y-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateState({ template: t.id })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      state.template === t.id
                        ? "border-[#d8ab5b] bg-[#d8ab5b]/8"
                        : "border-border/60 hover:border-border",
                    )}
                  >
                    <div className={cn("h-10 w-16 rounded-lg", t.preview)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.label}</p>
                      <span className={cn("mt-1 inline-block h-2 w-2 rounded-full", t.dot)} />
                    </div>
                    {state.template === t.id && (
                      <span className="text-[#d8ab5b] text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── CONTENT ─────────────────────────────────────────────────────── */}
          {step === "content" && (
            <>
              <h3 className="font-display text-base font-semibold">Event Content</h3>

              <Field label="Headline">
                <Input
                  value={state.headline}
                  onChange={(e) => updateState({ headline: e.target.value })}
                  placeholder={event.title}
                />
              </Field>

              <Field label="Subheadline">
                <Input
                  value={state.subheadline}
                  onChange={(e) => updateState({ subheadline: e.target.value })}
                  placeholder="One memorable line…"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={state.description_html}
                  onChange={(e) => updateState({ description_html: e.target.value })}
                  rows={6}
                  placeholder="Describe the vibe, the experience…"
                />
              </Field>

              <Field label="Dress Code">
                <Input
                  value={state.dress_code}
                  onChange={(e) => updateState({ dress_code: e.target.value })}
                  placeholder="All White, Masquerade…"
                />
              </Field>

              <Field label="Video URL (embed)">
                <Input
                  value={state.video_url}
                  onChange={(e) => updateState({ video_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/…"
                />
              </Field>

              <Field label="Lineup">
                <div className="flex gap-2">
                  <Input
                    value={lineupInput}
                    onChange={(e) => setLineupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && lineupInput.trim()) {
                        e.preventDefault();
                        const name = lineupInput.trim().replace(/,$/, "");
                        if (name) {
                          updateState({ lineup: [...state.lineup, name] });
                          setLineupInput("");
                        }
                      }
                    }}
                    placeholder="Artist / DJ name, Enter to add"
                  />
                </div>
                {state.lineup.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {state.lineup.map((name, i) => (
                      <Badge key={i} variant="secondary" className="gap-1.5">
                        {name}
                        <button
                          onClick={() =>
                            updateState({ lineup: state.lineup.filter((_, idx) => idx !== i) })
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          {/* ── GALLERY ─────────────────────────────────────────────────────── */}
          {step === "gallery" && (
            <>
              <h3 className="font-display text-base font-semibold">Gallery</h3>
              <p className="text-xs text-muted-foreground">Up to 6 images. Add image URLs below.</p>
              <div className="space-y-3">
                {state.gallery_image_urls.map((url, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const updated = [...state.gallery_image_urls];
                          updated[i] = e.target.value;
                          updateState({ gallery_image_urls: updated });
                        }}
                        placeholder="https://…/photo.jpg"
                        className="flex-1"
                      />
                      <button
                        onClick={() =>
                          updateState({
                            gallery_image_urls: state.gallery_image_urls.filter((_, idx) => idx !== i),
                          })
                        }
                        className="shrink-0 rounded-md border border-border/60 px-2 text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={`Gallery ${i + 1}`}
                        className="h-16 w-full rounded-md object-cover border border-border/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>
                ))}
                {state.gallery_image_urls.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateState({ gallery_image_urls: [...state.gallery_image_urls, ""] })
                    }
                  >
                    + Add Image
                  </Button>
                )}
              </div>
            </>
          )}

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          {step === "faq" && (
            <>
              <h3 className="font-display text-base font-semibold">FAQ</h3>
              <div className="space-y-4">
                {state.faq.map((item, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl border border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Question {i + 1}
                      </span>
                      <button
                        onClick={() =>
                          updateState({ faq: state.faq.filter((_, idx) => idx !== i) })
                        }
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(e) => {
                        const updated = state.faq.map((f, idx) =>
                          idx === i ? { ...f, question: e.target.value } : f,
                        );
                        updateState({ faq: updated });
                      }}
                      placeholder="What's the question?"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(e) => {
                        const updated = state.faq.map((f, idx) =>
                          idx === i ? { ...f, answer: e.target.value } : f,
                        );
                        updateState({ faq: updated });
                      }}
                      rows={3}
                      placeholder="The answer…"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    updateState({ faq: [...state.faq, { question: "", answer: "" }] })
                  }
                >
                  + Add Question
                </Button>
              </div>
            </>
          )}

          {/* ── VENUE ───────────────────────────────────────────────────────── */}
          {step === "venue" && (
            <>
              <h3 className="font-display text-base font-semibold">Venue</h3>

              <Field label="Google Maps Embed URL">
                <Input
                  value={state.venue_map_url}
                  onChange={(e) => updateState({ venue_map_url: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?…"
                />
              </Field>

              <Field label="Directions / Getting There">
                <Textarea
                  value={state.venue_directions}
                  onChange={(e) => updateState({ venue_directions: e.target.value })}
                  rows={4}
                  placeholder="Coming from the highway, turn left…"
                />
              </Field>

              <Field label="WhatsApp Contact">
                <Input
                  value={state.contact_whatsapp}
                  onChange={(e) => updateState({ contact_whatsapp: e.target.value })}
                  placeholder="+1 868 XXX XXXX"
                />
              </Field>

              <Field label="Email Contact">
                <Input
                  type="email"
                  value={state.contact_email}
                  onChange={(e) => updateState({ contact_email: e.target.value })}
                  placeholder="info@yourevent.com"
                />
              </Field>
            </>
          )}

          {/* ── SPONSORS ────────────────────────────────────────────────────── */}
          {step === "sponsors" && (
            <>
              <h3 className="font-display text-base font-semibold">Sponsors</h3>
              <div className="space-y-4">
                {state.sponsors.map((sp, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl border border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Sponsor {i + 1}
                      </span>
                      <button
                        onClick={() =>
                          updateState({ sponsors: state.sponsors.filter((_, idx) => idx !== i) })
                        }
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <Input
                      value={sp.name}
                      onChange={(e) => {
                        const updated = state.sponsors.map((s, idx) =>
                          idx === i ? { ...s, name: e.target.value } : s,
                        );
                        updateState({ sponsors: updated });
                      }}
                      placeholder="Sponsor name"
                    />
                    <Input
                      value={sp.logo_url}
                      onChange={(e) => {
                        const updated = state.sponsors.map((s, idx) =>
                          idx === i ? { ...s, logo_url: e.target.value } : s,
                        );
                        updateState({ sponsors: updated });
                      }}
                      placeholder="Logo URL"
                    />
                    <Input
                      value={sp.url}
                      onChange={(e) => {
                        const updated = state.sponsors.map((s, idx) =>
                          idx === i ? { ...s, url: e.target.value } : s,
                        );
                        updateState({ sponsors: updated });
                      }}
                      placeholder="Website URL"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    updateState({
                      sponsors: [...state.sponsors, { name: "", logo_url: "", url: "" }],
                    })
                  }
                >
                  + Add Sponsor
                </Button>
              </div>
            </>
          )}

          {/* ── TRACKING ────────────────────────────────────────────────────── */}
          {step === "tracking" && (
            <>
              <h3 className="font-display text-base font-semibold">Analytics & Tracking</h3>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200/80 space-y-1">
                <p className="font-semibold">What are these?</p>
                <p>
                  <strong>Meta Pixel</strong> — tracks ad conversions from Facebook & Instagram
                  campaigns. Find your Pixel ID in Meta Events Manager.
                </p>
                <p>
                  <strong>Google Analytics</strong> — tracks visitor data. Use your G-XXXXXXXXXX
                  Measurement ID from GA4.
                </p>
              </div>

              <Field label="Meta Pixel ID">
                <Input
                  value={state.meta_pixel_id}
                  onChange={(e) => updateState({ meta_pixel_id: e.target.value })}
                  placeholder="1234567890123456"
                />
              </Field>

              <Field label="Google Analytics ID">
                <Input
                  value={state.google_analytics_id}
                  onChange={(e) => updateState({ google_analytics_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </Field>
            </>
          )}

          {/* ── PUBLISH ─────────────────────────────────────────────────────── */}
          {step === "publish" && (
            <>
              <h3 className="font-display text-base font-semibold">Publish Settings</h3>

              <Field label="Custom URL Slug">
                <Input
                  value={state.custom_slug}
                  onChange={(e) => updateState({ custom_slug: slugify(e.target.value) })}
                  placeholder={event.slug}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Public URL:{" "}
                  <span className="font-mono text-foreground/80">
                    wefetepass.com/{effectiveSlug}
                  </span>
                </p>
              </Field>

              <div className="space-y-1">
                <Label>Current Status</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      state.status === "published"
                        ? "default"
                        : state.status === "unpublished"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {state.status}
                  </Badge>
                  {savedWebsite?.published_at ? (
                    <span className="text-xs text-muted-foreground">
                      Published {new Date(savedWebsite.published_at).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>

              <Separator />

              <div className="space-y-3 pt-1">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                >
                  Save Draft
                </Button>
                <Button
                  className="w-full bg-[#d8ab5b] text-black hover:bg-[#c79a52] font-semibold"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {state.status === "published" ? "Update & Keep Published" : "Publish Website"}
                </Button>
                {state.status === "published" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      updateState({ status: "unpublished" });
                      void handleSave(false);
                    }}
                    disabled={isSaving}
                  >
                    Unpublish
                  </Button>
                )}
              </div>

              {state.status === "published" && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-xs text-green-300/80">
                  Your event website is live at{" "}
                  <a
                    href={`/${effectiveSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-green-200"
                  >
                    wefetepass.com/{effectiveSlug}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Live Preview ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#030303]">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <span className="text-xs font-medium uppercase tracking-widest text-white/40">
            Live Preview
          </span>
          <a
            href={`/dashboard/events/${eventId}/website/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Full screen →
          </a>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="scale-[0.65] origin-top-left w-[154%]">
            <EventWebsitePreview
              website={previewWebsite}
              event={previewEvent}
              tiers={tiers}
              promoter={null}
              isPreview
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
