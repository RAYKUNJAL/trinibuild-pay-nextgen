"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  phone: z.string().regex(/^\+\d{8,15}$/, "Use international format"),
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export function VerifyForm({
  initialPhone,
  nextPath,
}: {
  initialPhone: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: initialPhone || "+1868", token: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: values.phone,
        token: values.token,
        type: "sms",
      });
      if (error || !data.user) {
        setServerError(error?.message ?? "Invalid code");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      const role = profile?.role ?? "attendee";
      const destination =
        nextPath && nextPath.startsWith("/")
          ? nextPath
          : role === "organizer" || role === "admin"
            ? "/dashboard"
            : "/wallet";
      router.push(destination);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          {...form.register("phone")}
        />
        {form.formState.errors.phone ? (
          <p className="mt-1 text-xs text-brand-red">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="token">6-digit code</Label>
        <Input
          id="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          {...form.register("token")}
        />
        {form.formState.errors.token ? (
          <p className="mt-1 text-xs text-brand-red">{form.formState.errors.token.message}</p>
        ) : null}
      </div>
      {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-red text-white hover:bg-brand-red/90"
      >
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        Verify
      </Button>
    </form>
  );
}
