"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
  name: z.string().max(80).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function WhatsappCapture({ eventCity }: { eventCity?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+1 868 ", name: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, city: eventCity ?? null }),
      });
      if (!res.ok) throw new Error("Could not subscribe right now.");
      setSubmitted(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden />
        <div>
          <p className="text-sm font-medium">You're on the list.</p>
          <p className="text-sm text-muted-foreground">
            We'll WhatsApp you when fetes drop in {eventCity ?? "your area"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="wa-phone">WhatsApp number</Label>
        <Input
          id="wa-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 868 555 1234"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wa-name">Name (optional)</Label>
        <Input id="wa-name" autoComplete="name" placeholder="Your name" {...register("name")} />
      </div>
      {serverError ? <p className="text-xs text-destructive">{serverError}</p> : null}
      <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-red text-white hover:bg-brand-red/90">
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
        {isSubmitting ? "Submitting..." : "Notify me on WhatsApp"}
      </Button>
    </form>
  );
}
