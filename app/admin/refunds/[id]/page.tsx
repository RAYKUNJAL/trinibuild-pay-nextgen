import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../_lib/auth";
import { getRefund } from "../../_lib/queries";
import { formatTTD } from "@/lib/utils";

export const metadata = { title: "Review refund — Admin" };

export default async function RefundReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const r = await getRefund(id);
  if (!r) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/refunds" className="text-sm text-muted-foreground hover:underline">
          ← Back to queue
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Refund review</h1>
        <p className="text-sm text-muted-foreground">Status: {r.status}</p>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Details
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Order</dt>
          <dd className="font-mono text-xs">{r.order_id}</dd>
          <dt className="text-muted-foreground">Event</dt>
          <dd className="font-mono text-xs">{r.event_id}</dd>
          <dt className="text-muted-foreground">Buyer</dt>
          <dd className="font-mono text-xs">{r.buyer_id}</dd>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium">
            {r.amount_cents !== null ? formatTTD(r.amount_cents) : "—"}
          </dd>
          <dt className="text-muted-foreground">Reason</dt>
          <dd>{r.reason ?? "—"}</dd>
          <dt className="text-muted-foreground">Reason detail</dt>
          <dd>{r.reason_detail ?? "—"}</dd>
          <dt className="text-muted-foreground">Organizer response</dt>
          <dd>{r.organizer_response ?? "—"}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="tabular-nums">{new Date(r.created_at).toLocaleString()}</dd>
        </dl>
      </section>

      {/* Admin-level refund decisions reuse the existing organizer refund respond endpoint
          path is not exposed here; the admin uses the announce/decision flow.
          A future admin-specific endpoint would live at /api/admin/refunds/[id]/decision. */}
      <p className="text-xs text-muted-foreground">
        Admin override of refund decisions is handled out of band — escalated cases create a
        dispute row that the platform team resolves with the affected promoter.
      </p>
    </div>
  );
}
