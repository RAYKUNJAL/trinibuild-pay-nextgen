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

const detailsSchema = z.object({
  full_name: z.string().min(2, "Tell us your name"),
  phone: z
    .string()
    .regex(/^\+\d{8,15}$/, "Use international format like +18687771234"),
});
const otpSchema = z.object({
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export function AttendeeSignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [details, setDetails] = useState<z.infer<typeof detailsSchema> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detailsForm = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { full_name: "", phone: "+1868" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: "" },
  });

  async function onSendCode(values: z.infer<typeof detailsSchema>) {
    setServerError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: values.phone,
        options: { data: { full_name: values.full_name, role: "attendee" } },
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      setDetails(values);
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(values: z.infer<typeof otpSchema>) {
    if (!details) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: details.phone,
        token: values.token,
        type: "sms",
      });
      if (error || !data.user) {
        setServerError(error?.message ?? "Invalid code");
        return;
      }
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          phone: details.phone,
          full_name: details.full_name,
          role: "attendee",
        },
        { onConflict: "id" },
      );
      if (upsertError) {
        setServerError(upsertError.message);
        return;
      }
      router.push("/wallet");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "details") {
    return (
      <>
        <h1 className="font-display text-2xl font-bold tracking-tight">Find your next fete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We text your QR tickets straight to WhatsApp.
        </p>
        <form onSubmit={detailsForm.handleSubmit(onSendCode)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" autoComplete="name" {...detailsForm.register("full_name")} />
            {detailsForm.formState.errors.full_name ? (
              <p className="mt-1 text-xs text-brand-red">
                {detailsForm.formState.errors.full_name.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 868 555 0123"
              {...detailsForm.register("phone")}
            />
            {detailsForm.formState.errors.phone ? (
              <p className="mt-1 text-xs text-brand-red">
                {detailsForm.formState.errors.phone.message}
              </p>
            ) : null}
          </div>
          {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red text-white hover:bg-brand-red/90"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Send code
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Confirm your number</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We texted a 6-digit code to{" "}
        <span className="font-medium text-foreground">{details?.phone}</span>.
      </p>
      <form onSubmit={otpForm.handleSubmit(onVerify)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="token">6-digit code</Label>
          <Input
            id="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...otpForm.register("token")}
          />
          {otpForm.formState.errors.token ? (
            <p className="mt-1 text-xs text-brand-red">
              {otpForm.formState.errors.token.message}
            </p>
          ) : null}
        </div>
        {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-red text-white hover:bg-brand-red/90"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Verify and continue
        </Button>
      </form>
    </>
  );
}
