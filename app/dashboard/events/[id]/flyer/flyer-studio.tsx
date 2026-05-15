"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ASPECT_RATIOS,
  FLYER_STYLES,
  type AspectRatioId,
  type FlyerStyleId,
} from "@/lib/flyer/styles";

interface FlyerCopy {
  headline: string;
  subhead: string;
  cta: string;
  hashtags: string[];
}

export interface SavedFlyer {
  id: string;
  event_id: string;
  prompt: string;
  style: string;
  aspect_ratio: string;
  copy_json: FlyerCopy | null;
  image_url: string | null;
  created_at: string;
}

interface GenerateResponse {
  id: string | null;
  copy: FlyerCopy;
  imageUrl: string | null;
  style: string;
  aspectRatio: string;
}

function assembleCaption(copy: FlyerCopy): string {
  return [
    copy.headline,
    copy.subhead,
    copy.cta,
    (copy.hashtags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function aspectClass(ratio: string): string {
  if (ratio === "9:16") return "aspect-[9/16]";
  if (ratio === "4:5") return "aspect-[4/5]";
  return "aspect-square";
}

export function FlyerStudio({
  eventId,
  eventTitle,
  initialFlyers,
}: {
  eventId: string;
  eventTitle: string;
  initialFlyers: SavedFlyer[];
}) {
  const [styleId, setStyleId] = useState<FlyerStyleId>(FLYER_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("1:1");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<GenerateResponse | null>(null);
  const [flyers, setFlyers] = useState<SavedFlyer[]>(initialFlyers);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const activeStyle = useMemo(
    () => FLYER_STYLES.find((s) => s.id === styleId) ?? FLYER_STYLES[0],
    [styleId],
  );

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setLatest(null);
    try {
      const res = await fetch("/api/flyer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          style: styleId,
          aspectRatio,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const json = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Generation failed");
      } else {
        setLatest(json);
        // Optimistically prepend to history
        startTransition(() => {
          setFlyers((prev) => [
            {
              id: json.id ?? `tmp-${Date.now()}`,
              event_id: eventId,
              prompt: customPrompt || eventTitle,
              style: json.style,
              aspect_ratio: json.aspectRatio,
              copy_json: json.copy,
              image_url: json.imageUrl,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyCaption(copy: FlyerCopy) {
    try {
      await navigator.clipboard.writeText(assembleCaption(copy));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function shareWhatsApp(copy: FlyerCopy) {
    const url = `https://wa.me/?text=${encodeURIComponent(assembleCaption(copy))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Tabs defaultValue="generate" className="space-y-6">
      <TabsList>
        <TabsTrigger value="generate">Generate New</TabsTrigger>
        <TabsTrigger value="library">My Flyers ({flyers.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-6">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Style
              </h2>
              <div className="flex flex-wrap gap-2">
                {FLYER_STYLES.map((s) => {
                  const active = s.id === styleId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyleId(s.id)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? "border-brand-red bg-brand-red/10 text-brand-red"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span aria-hidden>{s.emoji}</span>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{activeStyle.description}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Aspect ratio
              </h2>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((a) => {
                  const active = a.id === aspectRatio;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspectRatio(a.id)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-brand-red bg-brand-red/10 text-brand-red"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Custom prompt <span className="font-normal text-muted-foreground/70">(optional)</span>
              </h2>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. 'add dancers in white' or 'beach sunset vibe'"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Takes 5-15s. Image quality depends on REPLICATE_API_TOKEN being configured.
              </p>
              <Button
                onClick={onGenerate}
                disabled={loading}
                className="bg-brand-red text-white hover:bg-brand-red/90"
              >
                {loading ? "Generating…" : "Generate Flyer"}
              </Button>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className={`w-full ${aspectClass(aspectRatio)} rounded-md`} />
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-10 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {latest ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`overflow-hidden rounded-md bg-muted ${aspectClass(latest.aspectRatio)}`}>
                  {latest.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={latest.imageUrl}
                      alt="Generated flyer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      Image generation unavailable. Configure REPLICATE_API_TOKEN to enable visuals.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-bold">{latest.copy.headline}</h3>
                  <p className="text-muted-foreground">{latest.copy.subhead}</p>
                  <p className="font-medium">{latest.copy.cta}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {latest.copy.hashtags.map((h) => (
                      <Badge key={h} variant="secondary">
                        {h}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3">
                    {latest.imageUrl ? (
                      <Button variant="outline" asChild>
                        <a href={latest.imageUrl} download target="_blank" rel="noreferrer">
                          Download
                        </a>
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => copyCaption(latest.copy)}>
                      {copied ? "Copied!" : "Copy Caption"}
                    </Button>
                    <Button variant="outline" onClick={() => shareWhatsApp(latest.copy)}>
                      Share to WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>

      <TabsContent value="library">
        {flyers.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No flyers yet. Switch to “Generate New” to make your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flyers.map((f) => (
              <FlyerCard
                key={f.id}
                flyer={f}
                onDelete={(id) => setFlyers((prev) => prev.filter((x) => x.id !== id))}
                onCopyCaption={copyCaption}
                onShare={shareWhatsApp}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function FlyerCard({
  flyer,
  onDelete,
  onCopyCaption,
  onShare,
}: {
  flyer: SavedFlyer;
  onDelete: (id: string) => void;
  onCopyCaption: (copy: FlyerCopy) => void;
  onShare: (copy: FlyerCopy) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const copy = flyer.copy_json;

  async function handleDelete() {
    if (!confirm("Delete this flyer?")) return;
    setDeleting(true);
    // Optimistic delete — RLS allows owner to delete.
    onDelete(flyer.id);
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className={`overflow-hidden rounded-md bg-muted ${aspectClass(flyer.aspect_ratio)}`}>
          {flyer.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flyer.image_url} alt="Flyer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              Copy-only flyer
            </div>
          )}
        </div>
        {copy ? (
          <div className="space-y-1">
            <p className="line-clamp-1 font-semibold">{copy.headline}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{copy.subhead}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {flyer.style}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {flyer.aspect_ratio}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {copy ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onCopyCaption(copy)}>
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShare(copy)}>
                Share
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
