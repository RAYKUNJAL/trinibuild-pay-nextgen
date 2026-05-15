import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../_lib/auth";
import { getVerification } from "../../_lib/queries";

export const metadata = { title: "Review verification — Admin" };

export default async function VerificationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const v = await getVerification(id);
  if (!v) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/verifications"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to queue
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Verification review</h1>
        <p className="text-sm text-muted-foreground">Status: {v.status}</p>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Promoter
        </h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-muted-foreground">Account name</dt>
          <dd className="font-medium">{v.profile?.full_name ?? "—"}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="font-medium">{v.profile?.phone ?? "—"}</dd>
          <dt className="text-muted-foreground">Legal name</dt>
          <dd className="font-medium">{v.legal_name ?? "—"}</dd>
          <dt className="text-muted-foreground">Business reg #</dt>
          <dd className="font-medium">{v.business_reg_number ?? "—"}</dd>
          <dt className="text-muted-foreground">Submitted</dt>
          <dd className="tabular-nums">{new Date(v.created_at).toLocaleString()}</dd>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Documents
        </h2>
        <ul className="space-y-2 text-sm">
          {v.id_document_url ? (
            <li>
              <a
                href={v.id_document_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                ID document
              </a>
            </li>
          ) : (
            <li className="text-muted-foreground">No ID document uploaded.</li>
          )}
          {(v.social_proof_urls ?? []).map((url, i) => (
            <li key={i}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Social proof {i + 1}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <DecisionForm verificationId={v.id} />
    </div>
  );
}

function DecisionForm({ verificationId }: { verificationId: string }) {
  return (
    <form
      action={`/api/admin/verifications/${verificationId}/decision`}
      method="post"
      className="space-y-3 rounded-lg border bg-card p-4"
      encType="application/x-www-form-urlencoded"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Decision
      </h2>
      <textarea
        name="notes"
        rows={3}
        placeholder="Internal notes (required for denial)"
        className="w-full rounded border bg-background p-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Deny
        </button>
      </div>
    </form>
  );
}
