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

const phoneSchema = z.object({
  phone: z
    .string()
    .min(8, "Enter your phone number")
    .regex(/^\+\d{8,15}$/, "Use international format like +18687771234"),
});
const otpSchema = z.object({
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type Step = "phone" | "otp";

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "+1868" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: "" },
  });

  async function onSendCode(values: z.infer<typeof phoneSchema>) {
    setServerError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: values.phone });
      if (error) {
        setServerError(error.message);
        return;
      }
      setPhone(values.phone);
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(values: z.infer<typeof otpSchema>) {
    setServerError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: values.token,
        type: "sms",
      });
      if (error || !data.user) {
        setServerError(error?.message ?? "Invalid code");
        return;
      }
      // Look up profile role to decide destination
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

  if (step === "phone") {
    return (
      <form onSubmit={phoneForm.handleSubmit(onSendCode)} className="space-y-4">
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+1 868 555 0123"
            autoComplete="tel"
            {...phoneForm.register("phone")}
            aria-invalid={!!phoneForm.formState.errors.phone}
          />
          {phoneForm.formState.errors.phone ? (
            <p className="mt-1 text-xs text-brand-red">{phoneForm.formState.errors.phone.message}</p>
          ) : null}
        </div>
        {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
        <Button
          type="submit"
          className="w-full bg-brand-red text-white hover:bg-brand-red/90"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Send code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Code sent to <span className="font-medium text-foreground">{phone}</span>.
      </p>
      <div>
        <Label htmlFor="token">6-digit code</Label>
        <Input
          id="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          {...otpForm.register("token")}
          aria-invalid={!!otpForm.formState.errors.token}
        />
        {otpForm.formState.errors.token ? (
          <p className="mt-1 text-xs text-brand-red">{otpForm.formState.errors.token.message}</p>
        ) : null}
      </div>
      {serverError ? <p className="text-sm text-brand-red">{serverError}</p> : null}
      <Button
        type="submit"
        className="w-full bg-brand-red text-white hover:bg-brand-red/90"
        disabled={submitting}
      >
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        Verify and sign in
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => {
          setStep("phone");
          setServerError(null);
        }}
      >
        Use a different number
      </button>
    </form>
  );
}
