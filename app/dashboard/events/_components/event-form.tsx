"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ISLANDS, getIslandCities, DEFAULT_ISLAND } from "@/lib/islands";

const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tier name required"),
  description: z.string().optional().nullable(),
  price_ttd: z.coerce.number().min(0, "Price must be positive"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  sales_start_at: z.string().optional().nullable(),
  sales_end_at: z.string().optional().nullable(),
});

const eventSchema = z.object({
  title: z.string().min(2, "Title required"),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  venue: z.string().min(1, "Venue required"),
  island: z.string().min(1, "Island required"),
  city: z.string().min(1, "City required"),
  starts_at: z.string().min(1, "Start date required"),
  ends_at: z.string().optional().nullable(),
  gate_open_at: z.string().optional().nullable(),
  cover_image_url: z.string().url().optional().or(z.literal("")).nullable(),
  tiers: z.array(tierSchema).min(1, "Add at least one ticket tier"),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export type EventFormInitial = {
  id?: string;
  title?: string;
  tagline?: string | null;
  description?: string | null;
  venue?: string;
  island?: string;
  city?: string;
  starts_at?: string;
  ends_at?: string | null;
  gate_open_at?: string | null;
  cover_image_url?: string | null;
  tiers?: Array<{
    id?: string;
    name: string;
    description?: string | null;
    price_cents: number;
    quantity: number;
    sales_start_at?: string | null;
    sales_end_at?: string | null;
  }>;
};

function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  initial,
  mode,
}: {
  initial?: EventFormInitial;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initial?.title ?? "",
      tagline: initial?.tagline ?? "",
      description: initial?.description ?? "",
      venue: initial?.venue ?? "",
      island: initial?.island ?? DEFAULT_ISLAND,
      city: initial?.city ?? "Port of Spain",
      starts_at: toLocalInput(initial?.starts_at),
      ends_at: toLocalInput(initial?.ends_at),
      gate_open_at: toLocalInput(initial?.gate_open_at),
      cover_image_url: initial?.cover_image_url ?? "",
      tiers:
        initial?.tiers && initial.tiers.length > 0
          ? initial.tiers.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description ?? "",
              price_ttd: (t.price_cents ?? 0) / 100,
              quantity: t.quantity ?? 100,
              sales_start_at: toLocalInput(t.sales_start_at),
              sales_end_at: toLocalInput(t.sales_end_at),
            }))
          : [
              {
                name: "General Admission",
                description: "",
                price_ttd: 200,
                quantity: 100,
                sales_start_at: "",
                sales_end_at: "",
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  const selectedIsland = useWatch({ control: form.control, name: "island" });
  const islandInfo = ISLANDS.find((i) => i.code === selectedIsland) ?? ISLANDS[0];
  const cityOptions = getIslandCities(selectedIsland);
  const priceCurrencyLabel = `Price (${islandInfo.currency})`;

  async function onSubmit(values: EventFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        event: {
          title: values.title,
          tagline: values.tagline || null,
          description: values.description || null,
          venue: values.venue,
          island: values.island,
          city: values.city,
          starts_at: new Date(values.starts_at).toISOString(),
          ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
          gate_open_at: values.gate_open_at
            ? new Date(values.gate_open_at).toISOString()
            : null,
          cover_image_url: values.cover_image_url || null,
          status: "draft" as const,
        },
        tiers: values.tiers.map((t, i) => ({
          id: t.id,
          name: t.name,
          description: t.description || null,
          price_cents: Math.round((t.price_ttd ?? 0) * 100),
          quantity: t.quantity,
          sales_start_at: t.sales_start_at ? new Date(t.sales_start_at).toISOString() : null,
          sales_end_at: t.sales_end_at ? new Date(t.sales_end_at).toISOString() : null,
          position: i,
        })),
      };

      const url = mode === "create" ? "/api/events" : `/api/events/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(body?.error ?? `Failed (${res.status})`);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { id?: string };
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/dashboard/events/${id}/edit`);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border/60">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Event details</h2>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="mt-1 text-xs text-brand-red">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...form.register("tagline")} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...form.register("description")} />
          </div>

          {/* Island + venue + city row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="island">Island</Label>
              <select
                id="island"
                {...form.register("island")}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {ISLANDS.map((isl) => (
                  <option key={isl.code} value={isl.code}>
                    {isl.flag} {isl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...form.register("venue")} />
              {form.formState.errors.venue ? (
                <p className="mt-1 text-xs text-brand-red">
                  {form.formState.errors.venue.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                {...form.register("city")}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="starts_at">Starts at</Label>
              <Input id="starts_at" type="datetime-local" {...form.register("starts_at")} />
              {form.formState.errors.starts_at ? (
                <p className="mt-1 text-xs text-brand-red">
                  {form.formState.errors.starts_at.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="ends_at">Ends at</Label>
              <Input id="ends_at" type="datetime-local" {...form.register("ends_at")} />
            </div>
            <div>
              <Label htmlFor="gate_open_at">Gate opens at</Label>
              <Input id="gate_open_at" type="datetime-local" {...form.register("gate_open_at")} />
            </div>
          </div>
          <div>
            <Label htmlFor="cover_image_url">Cover image URL</Label>
            <Input id="cover_image_url" type="url" {...form.register("cover_image_url")} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Ticket tiers</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  name: "",
                  description: "",
                  price_ttd: 0,
                  quantity: 100,
                  sales_start_at: "",
                  sales_end_at: "",
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Add tier
            </Button>
          </div>
          {form.formState.errors.tiers && !Array.isArray(form.formState.errors.tiers) ? (
            <p className="text-xs text-brand-red">
              {(form.formState.errors.tiers as { message?: string }).message}
            </p>
          ) : null}
          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="space-y-3 rounded-md border border-border/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tier {i + 1}
                  </span>
                  {fields.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(i)}
                      aria-label="Remove tier"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <Input {...form.register(`tiers.${i}.name`)} />
                  </div>
                  <div>
                    <Label>{priceCurrencyLabel}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`tiers.${i}.price_ttd`)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input {...form.register(`tiers.${i}.description`)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`tiers.${i}.quantity`)}
                    />
                  </div>
                  <div>
                    <Label>Sales start</Label>
                    <Input
                      type="datetime-local"
                      {...form.register(`tiers.${i}.sales_start_at`)}
                    />
                  </div>
                  <div>
                    <Label>Sales end</Label>
                    <Input
                      type="datetime-local"
                      {...form.register(`tiers.${i}.sales_end_at`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-red text-white hover:bg-brand-red/90"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
