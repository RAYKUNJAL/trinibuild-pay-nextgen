"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  BadgeCheck,
  ArrowRight,
  FileText,
  Building,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrustBadge } from "@/components/trust-badge";
import { cn } from "@/lib/utils";

type VerificationRecord = {
  id: string;
  status: "not_applied" | "pending" | "approved" | "rejected";
  legal_name: string | null;
  business_reg_number: string | null;
  id_document_url: string | null;
  social_proof_urls: string[];
  admin_note: string | null;
  created_at: string;
};

type FormState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; verificationId: string }
  | { phase: "error"; message: string };

// ─── Benefits sidebar ─────────────────────────────────────────────────────────

function BenefitsList() {
  return (
    <Card className="border-[#d8ab5b]/25 bg-[#0d0b07]">
      <div className="h-[3px] w-full rounded-t-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31]" />
      <CardHeader>
        <CardTitle className="text-[#f2d9ad]">Why get verified?</CardTitle>
        <CardDescription className="text-[#e8dfd2]/60">
          Unlock lower fees and higher buyer trust.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {[
            {
              label: "Verified badge on all your events",
              detail: "Gold checkmark badge displayed on every event page and search result.",
            },
            {
              label: "Lower platform fee: 6.5%",
              detail: "Down from the standard 7.5% — permanently, for every ticket you sell.",
            },
            {
              label: "Priority in search",
              detail: "Verified events rank higher in discovery and category listings.",
            },
            {
              label: "Higher buyer conversion",
              detail: "Buyers are significantly more likely to purchase from a verified promoter.",
            },
          ].map(({ label, detail }) => (
            <li key={label} className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#d8ab5b]"
                aria-hidden
              />
              <div>
                <p className="font-medium text-[#f2d9ad]">{label}</p>
                <p className="text-[#e8dfd2]/55">{detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-[#d8ab5b]/20 bg-black/30 px-4 py-3">
          <div className="text-sm">
            <p className="text-[#e8dfd2]/60 line-through">7.5% standard</p>
            <p className="font-bold text-[#d8ab5b]">6.5% verified</p>
          </div>
          <TrustBadge verified size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Application form ─────────────────────────────────────────────────────────

function ApplicationForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [legalName, setLegalName] = useState("");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [socialProofUrls, setSocialProofUrls] = useState("");
  const [formState, setFormState] = useState<FormState>({ phase: "idle" });

  const isSubmitting = formState.phase === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!legalName.trim()) return;

    setFormState({ phase: "submitting" });

    const urls = socialProofUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    try {
      const res = await fetch("/api/verification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: legalName.trim(),
          businessRegNumber: businessRegNumber.trim() || undefined,
          idDocumentUrl: idDocumentUrl.trim() || undefined,
          socialProofUrls: urls.length > 0 ? urls : undefined,
        }),
      });

      const data = (await res.json()) as {
        verificationId?: string;
        status?: string;
        error?: string;
      };

      if (!res.ok) {
        setFormState({
          phase: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      if (data.verificationId) {
        onSuccess(data.verificationId);
      } else {
        setFormState({ phase: "error", message: "Unexpected response from server." });
      }
    } catch {
      setFormState({
        phase: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  return (
    <Card className="border-neutral-800 bg-[#0a0906]">
      <CardHeader>
        <CardTitle className="text-[#f2d9ad]">Verification application</CardTitle>
        <CardDescription className="text-[#e8dfd2]/60">
          We review every application within 2–3 business days. All documents are kept confidential.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Legal name */}
          <div className="space-y-1.5">
            <Label htmlFor="legal-name" className="flex items-center gap-1.5 text-[#e8dfd2]/80">
              <FileText className="h-3.5 w-3.5 text-[#d8ab5b]/70" aria-hidden />
              Legal name{" "}
              <span className="text-red-400">*</span>
            </Label>
            <Input
              id="legal-name"
              placeholder="Your full legal name or registered business name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Business registration */}
          <div className="space-y-1.5">
            <Label
              htmlFor="biz-reg"
              className="flex items-center gap-1.5 text-[#e8dfd2]/80"
            >
              <Building className="h-3.5 w-3.5 text-[#d8ab5b]/70" aria-hidden />
              Business registration number{" "}
              <span className="text-[#e8dfd2]/40">(optional)</span>
            </Label>
            <Input
              id="biz-reg"
              placeholder="e.g. T&T Companies Registry number"
              value={businessRegNumber}
              onChange={(e) => setBusinessRegNumber(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* ID document URL */}
          <div className="space-y-1.5">
            <Label
              htmlFor="id-doc"
              className="flex items-center gap-1.5 text-[#e8dfd2]/80"
            >
              <FileText className="h-3.5 w-3.5 text-[#d8ab5b]/70" aria-hidden />
              Government-issued ID — document URL{" "}
              <span className="text-[#e8dfd2]/40">(optional)</span>
            </Label>
            <Input
              id="id-doc"
              type="url"
              placeholder="https://... (Supabase Storage link — upload coming soon)"
              value={idDocumentUrl}
              onChange={(e) => setIdDocumentUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#e8dfd2]/40">
              Supabase Storage integration in progress. For now, upload to any secure host and paste the link.
            </p>
          </div>

          {/* Social proof */}
          <div className="space-y-1.5">
            <Label
              htmlFor="social-urls"
              className="flex items-center gap-1.5 text-[#e8dfd2]/80"
            >
              <Link2 className="h-3.5 w-3.5 text-[#d8ab5b]/70" aria-hidden />
              Social proof links{" "}
              <span className="text-[#e8dfd2]/40">(optional)</span>
            </Label>
            <Textarea
              id="social-urls"
              placeholder={"https://instagram.com/yourpage\nhttps://facebook.com/yourpage"}
              value={socialProofUrls}
              onChange={(e) => setSocialProofUrls(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#e8dfd2]/40">
              One URL per line. Instagram, Facebook, or any public page that confirms your brand identity.
            </p>
          </div>

          {formState.phase === "error" ? (
            <p className="rounded-lg border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {formState.message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting || !legalName.trim()}
            className="w-full bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] text-black hover:opacity-90"
          >
            {isSubmitting ? "Submitting application..." : "Submit for verification"}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" aria-hidden />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Status views ─────────────────────────────────────────────────────────────

function PendingView({ record }: { record: VerificationRecord }) {
  const submittedDate = new Date(record.created_at).toLocaleDateString("en-TT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="border-[#d8ab5b]/25 bg-[#0d0b07]">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#d8ab5b]/30 bg-[#d8ab5b]/10">
          <Clock className="h-6 w-6 text-[#d8ab5b]" aria-hidden />
        </div>
        <CardTitle className="text-[#f2d9ad]">Under review</CardTitle>
        <CardDescription className="text-[#e8dfd2]/60">
          Submitted {submittedDate} — typically 2–3 business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-[#d8ab5b]/15 bg-black/30 p-4 text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d8ab5b]/70">
            Your submission
          </p>
          <dl className="space-y-2 text-[#e8dfd2]/70">
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-[#e8dfd2]/40">Legal name</dt>
              <dd>{record.legal_name ?? "—"}</dd>
            </div>
            {record.business_reg_number ? (
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-[#e8dfd2]/40">Business reg.</dt>
                <dd>{record.business_reg_number}</dd>
              </div>
            ) : null}
            {record.social_proof_urls.length > 0 ? (
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-[#e8dfd2]/40">Social links</dt>
                <dd className="space-y-1">
                  {record.social_proof_urls.map((u) => (
                    <a
                      key={u}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[#d8ab5b] hover:underline"
                    >
                      {u}
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <p className="mt-4 text-sm text-[#e8dfd2]/55">
          We will notify you by email once the review is complete. If you need to update your application, please contact support.
        </p>
      </CardContent>
    </Card>
  );
}

function ApprovedView() {
  return (
    <Card className="border-[#d8ab5b]/40 bg-[#0d0b07] shadow-[0_0_48px_rgba(216,171,91,0.12)]">
      <div className="h-[3px] w-full rounded-t-lg bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31]" />
      <CardHeader>
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8ab5b]/50 bg-[#d8ab5b]/15 shadow-[0_0_20px_rgba(216,171,91,0.25)]">
          <BadgeCheck className="h-7 w-7 text-[#d8ab5b]" aria-hidden />
        </div>
        <CardTitle className="text-[#f2d9ad]">You are verified.</CardTitle>
        <CardDescription className="text-[#e8dfd2]/60">
          Your identity and business have been confirmed by the WeFetePass trust team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-[#d8ab5b]/20 bg-black/30 px-5 py-4">
          <TrustBadge verified size="lg" />
          <p className="text-sm text-[#e8dfd2]/70">
            Your badge appears on all published events and your promoter profile.
          </p>
        </div>

        <ul className="space-y-2 text-sm text-[#e8dfd2]/70">
          {[
            "Platform fee permanently reduced to 6.5%",
            "Verified badge on all your event pages",
            "Priority in discovery and search results",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8ab5b]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <Button asChild className="w-full bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] text-black hover:opacity-90">
          <Link href="/dashboard/events">
            Manage your events
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RejectedView({
  record,
  onReapply,
}: {
  record: VerificationRecord;
  onReapply: () => void;
}) {
  return (
    <Card className="border-red-800/30 bg-[#0d0908]">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-red-700/40 bg-red-950/20">
          <XCircle className="h-6 w-6 text-red-400" aria-hidden />
        </div>
        <CardTitle className="text-[#f2d9ad]">Application not approved</CardTitle>
        <CardDescription className="text-[#e8dfd2]/60">
          Your application was reviewed but could not be approved at this time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {record.admin_note ? (
          <div className="rounded-lg border border-red-700/30 bg-red-950/20 p-4 text-sm">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-400/80">
              Review note
            </p>
            <p className="text-[#e8dfd2]/70">{record.admin_note}</p>
          </div>
        ) : (
          <p className="text-sm text-[#e8dfd2]/60">
            No additional note was provided. Please contact support if you have questions.
          </p>
        )}

        <p className="text-sm text-[#e8dfd2]/55">
          You may reapply by submitting a new application with updated or corrected information.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onReapply}
            className="bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31] text-black hover:opacity-90"
          >
            Reapply with updated information
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function VerificationContent({
  record,
}: {
  record: VerificationRecord | null;
}) {
  const [localRecord, setLocalRecord] = useState<VerificationRecord | null>(record);
  const [showReapplyForm, setShowReapplyForm] = useState(false);

  function handleSuccess(verificationId: string) {
    setLocalRecord((prev) => ({
      id: verificationId,
      status: "pending",
      legal_name: prev?.legal_name ?? null,
      business_reg_number: prev?.business_reg_number ?? null,
      id_document_url: prev?.id_document_url ?? null,
      social_proof_urls: prev?.social_proof_urls ?? [],
      admin_note: null,
      created_at: new Date().toISOString(),
    }));
    setShowReapplyForm(false);
  }

  const status = localRecord?.status ?? "not_applied";
  const showForm =
    status === "not_applied" ||
    (status === "rejected" && showReapplyForm);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Promoter verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn the Verified badge, lower your fee to 6.5%, and build buyer trust.
        </p>
      </div>

      <div
        className={cn(
          "grid gap-6",
          status === "approved" ? "lg:grid-cols-1" : "lg:grid-cols-[1fr_360px]",
        )}
      >
        {/* Left: status/form */}
        <div className="space-y-6">
          {showForm ? (
            <ApplicationForm onSuccess={handleSuccess} />
          ) : status === "pending" && localRecord ? (
            <PendingView record={localRecord} />
          ) : status === "approved" ? (
            <ApprovedView />
          ) : status === "rejected" && localRecord ? (
            <RejectedView record={localRecord} onReapply={() => setShowReapplyForm(true)} />
          ) : null}
        </div>

        {/* Right: benefits (hidden when approved) */}
        {status !== "approved" ? (
          <aside>
            <BenefitsList />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
