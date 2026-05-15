import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../_lib/auth";
import { getReceipt } from "../../_lib/queries";
import { formatTTD } from "@/lib/utils";

export const metadata = { title: "Review receipt — Admin" };

const FRAUD_COLOR: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  high: "bg-red-500/20 text-red-300",
  auto_reject: "bg-red-700/30 text-red-200",
};

export default async function ReceiptReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const r = await getReceipt(id);
  if (!r) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/receipts"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to queue
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Receipt review</h1>
        <p className="text-sm text-muted-foreground">Status: {r.status}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Receipt image
          </h2>
          {r.receipt_url ? (
            <div className="relative w-full overflow-hidden rounded border bg-muted">
              <Image
                src={r.receipt_url}
                alt="Bank receipt"
                width={800}
                height={1000}
                className="h-auto w-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No image uploaded.</div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Receipt details
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Bank</dt>
              <dd className="font-medium">{r.bank_name ?? "—"}</dd>
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono text-xs">{r.reference_number ?? "—"}</dd>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">
                {r.amount_cents !== null ? formatTTD(r.amount_cents) : "—"}
              </dd>
              <dt className="text-muted-foreground">AI fraud level</dt>
              <dd>
                {r.fraud_level ? (
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      FRAUD_COLOR[r.fraud_level] ?? "bg-muted"
                    }`}
                  >
                    {r.fraud_level}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-muted-foreground">AI confidence</dt>
              <dd className="tabular-nums">
                {r.ai_confidence !== null ? `${Math.round((r.ai_confidence ?? 0) * 100)}%` : "—"}
              </dd>
            </dl>
            {r.ai_notes ? (
              <div className="mt-3 rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                {r.ai_notes}
              </div>
            ) : null}
          </div>

          {r.order ? (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Order
              </h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd className="font-mono text-xs">{r.order.id}</dd>
                <dt className="text-muted-foreground">Order total</dt>
                <dd className="font-medium">{formatTTD(r.order.total_cents)}</dd>
                <dt className="text-muted-foreground">Order status</dt>
                <dd>{r.order.status}</dd>
              </dl>
            </div>
          ) : null}

          <form
            action={`/api/admin/receipts/${r.id}/decision`}
            method="post"
            className="space-y-3 rounded-lg border bg-card p-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Decision
            </h2>
            <textarea
              name="notes"
              rows={3}
              placeholder="Internal notes (optional)"
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
                value="reject"
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
