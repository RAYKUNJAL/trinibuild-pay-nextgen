import Link from "next/link";
import { requireAdmin } from "../_lib/auth";
import { listPendingReceipts } from "../_lib/queries";
import { formatTTD } from "@/lib/utils";

export const metadata = { title: "Receipts — Admin" };

const FRAUD_COLOR: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  high: "bg-red-500/20 text-red-300",
  auto_reject: "bg-red-700/30 text-red-200",
};

export default async function ReceiptsPage() {
  await requireAdmin();
  const rows = await listPendingReceipts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bank receipts</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} pending / flagged receipt{rows.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Bank</th>
              <th className="px-4 py-2 text-left">Reference</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">AI fraud</th>
              <th className="px-4 py-2 text-left">Submitted</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No receipts to review.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.bank_name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.reference_number ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {r.amount_cents !== null ? formatTTD(r.amount_cents) : "—"}
                  </td>
                  <td className="px-4 py-2">
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
                  </td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/receipts/${r.id}`}
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
    </div>
  );
}
