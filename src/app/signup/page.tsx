"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: form.get("organizationName"),
        slug: form.get("slug"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error?.message ?? "Signup failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-ink-100 p-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink-900">
          <span className="inline-block h-7 w-7 rounded-lg bg-brand-500" />
          CashConnect
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-ink-900">Create your workspace</h1>
        <p className="mt-1 text-sm text-ink-500">Start in TRIAL with 1,000 free test verifications.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field name="organizationName" label="Organization name" placeholder="Demo Fintech Ltd" />
          <Field name="slug" label="Workspace slug" placeholder="demo-fintech" pattern="[a-z0-9-]{3,40}" />
          <Field name="email" label="Work email" type="email" placeholder="you@company.com" />
          <Field name="password" label="Password" type="password" placeholder="At least 10 characters" minLength={10} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            disabled={pending}
            type="submit"
            className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create workspace"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-900">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

type FieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  pattern?: string;
  minLength?: number;
};

function Field({ name, label, placeholder, type = "text", pattern, minLength }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      <input
        required
        name={name}
        type={type}
        pattern={pattern}
        minLength={minLength}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-ink-100 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
