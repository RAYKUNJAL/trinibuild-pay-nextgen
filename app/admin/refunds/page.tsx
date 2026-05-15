import Link from "next/link";
import { requireAdmin } from "../_lib/auth";
import { listRefundsAndDisputes } from "../_lib/queries";
import { formatTTD } from "@/lib/utils";

export const metadata = { title: "Refunds — Admin" };

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab } = await searchParams;
  const { refunds, disputes } = await listRefundsAndDisputes();
  const activeTab = tab === "disputes" ? "disputes" : "refunds";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refunds & disputes</h1>
        <p className="text-sm text-muted-foreground">
          {refunds.length} pending refund{refunds.length === 1 ? "" : "s"} ·{" "}
          {disputes.length} open dispute{disputes.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <Link
          href="/admin/refunds"
          className={
            "border-b-2 px-3 py-2 text-sm font-medium " +
            (activeTab === "refunds"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground")
          }
        >
          Refunds ({refunds.length})
        </Link>
        <Link
          href="/admin/refunds?tab=disputes"
          className={
            "border-b-2 px-3 py-2 text-sm font-medium " +
            (activeTab === "disputes"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground")
          }
        >
          Disputes ({disputes.length})
        </Link>
      </div>

      {activeTab === "refunds" ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No refunds awaiting decision.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{r.order_id.slice(0, 8)}…</td>
                    <td className="px-4 py-2">{r.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.amount_cents !== null ? formatTTD(r.amount_cents) : "—"}
                    </td>
                    <td className="px-4 py-2">{r.status}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/refunds/${r.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Dispute</th>
                <th className="px-4 py-2 text-left">Linked refund</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No open disputes.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{d.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {d.refund_request_id ? (
                        <Link
                          href={`/admin/refunds/${d.refund_request_id}`}
                          className="text-primary hover:underline"
                        >
                          {d.refund_request_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{d.status}</td>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
