"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const detailsSchema = z.object({
  full_name: z.string().min(2, "Tell us your name"),
  phone: z
    .string()
    .regex(/^\+\d{8,15}$/, "Use international format like +18687771234"),
  brand_name: z.string().min(2, "Brand or company name required"),
  business_reg_number: z.string().min(1, "T&T business registration number required"),
  agree: z.literal(true, {
    errorMap: () => ({ message: "Please agree to continue" }),
  }),
});
const otpSchema = z.object({
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type Step = "details" | "otp" | "submitted";

export function PromoterSignUpForm() {
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<z.infer<typeof detailsSchema> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detailsForm = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      full_name: "",
      phone: "+1868",
      brand_name: "",
      business_reg_number: "",
      agree: false as unknown as true,
    },
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
        options: {
          data: {
            full_name: values.full_name,
            role: "promoter",
            brand_name: values.brand_name,
            business_reg_number: values.business_reg_number,
            status: "pending_approval",
          },
        },
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
      // Persist promoter profile. DB role enum uses "organizer".
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          phone: details.phone,
          full_name: details.full_name,
          role: "organizer",
        },
        { onConflict: "id" },
      );
      if (upsertError) {
        setServerError(upsertError.message);
        return;
      }
      // Stash promoter-specific metadata on the auth user
      await supabase.auth.updateUser({
        data: {
          brand_name: details.brand_name,
          business_reg_number: details.business_reg_number,
          status: "pending_approval",
        },
      });
      setStep("submitted");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "submitted") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          Application received
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll WhatsApp you within 24 hours to verify your business and unlock your
          promoter dashboard.
        </p>
      </div>
    );
  }

  if (step === "otp") {
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
            Submit application
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Apply to sell tickets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We verify every promoter so buyers know your fete is real.
      </p>
      <form onSubmit={detailsForm.handleSubmit(onSendCode)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="full_name">Your full name</Label>
          <Input id="full_name" autoComplete="name" {...detailsForm.register("full_name")} />
          {detailsForm.formState.errors.full_name ? (
            <p className="mt-1 text-xs text-brand-red">
              {detailsForm.formState.errors.full_name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="brand_name">Promoter / brand name</Label>
          <Input id="brand_name" {...detailsForm.register("brand_name")} />
          {detailsForm.formState.errors.brand_name ? (
            <p className="mt-1 text-xs text-brand-red">
              {detailsForm.formState.errors.brand_name.message}
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
        <div>
          <Label htmlFor="business_reg_number">T&amp;T business registration number</Label>
          <Input id="business_reg_number" {...detailsForm.register("business_reg_number")} />
          {detailsForm.formState.errors.business_reg_number ? (
            <p className="mt-1 text-xs text-brand-red">
              {detailsForm.formState.errors.business_reg_number.message}
            </p>
          ) : null}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border"
            {...detailsForm.register("agree")}
          />
          <span className="text-muted-foreground">
            I agree to the WeFetePass promoter terms, payout schedule, and conduct policy.
          </span>
        </label>
        {detailsForm.formState.errors.agree ? (
          <p className="text-xs text-brand-red">{detailsForm.formState.errors.agree.message}</p>
        ) : null}
        {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-red text-white hover:bg-brand-red/90"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Apply to sell tickets
        </Button>
      </form>
    </>
  );
}
