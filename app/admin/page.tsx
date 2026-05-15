import Link from "next/link";
import { requireAdmin } from "./_lib/auth";
import { getPlatformMetrics } from "./_lib/queries";
import { MetricCard } from "./_components/metric-card";
import { formatTTD } from "@/lib/utils";
import { getIslandByCode } from "@/lib/islands";

export const metadata = { title: "Admin Overview — WeFetePass" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const metrics = await getPlatformMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">
          Last 30 days. Operator view — all orgs, all islands.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue (30d)"
          value={formatTTD(metrics.totalRevenue30dCents)}
          tone="success"
        />
        <MetricCard label="Orders (30d)" value={metrics.ordersLast30d.toLocaleString()} />
        <MetricCard
          label="Passes issued (30d)"
          value={metrics.passesIssued30d.toLocaleString()}
        />
        <MetricCard
          label="Active promoters"
          value={metrics.activePromoters.toLocaleString()}
          hint={`${metrics.publishedEvents} published events`}
        />
      </div>

      {/* Action-required */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Action required</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            href="/admin/verifications"
            count={metrics.pendingVerifications}
            label="pending verifications"
            tone={metrics.pendingVerifications > 0 ? "warn" : "default"}
          />
          <ActionCard
            href="/admin/receipts"
            count={metrics.pendingReceipts}
            label="bank receipts to review"
            tone={metrics.pendingReceipts > 0 ? "warn" : "default"}
          />
          <ActionCard
            href="/admin/refunds"
            count={metrics.pendingRefunds}
            label="refunds awaiting decision"
            tone={metrics.pendingRefunds > 0 ? "warn" : "default"}
          />
          <ActionCard
            href="/admin/refunds?tab=disputes"
            count={metrics.openDisputes}
            label="open disputes"
            tone={metrics.openDisputes > 0 ? "danger" : "default"}
          />
        </div>
      </div>

      {/* Island breakdown */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">By island</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Island</th>
                <th className="px-4 py-2 text-right">Published events</th>
                <th className="px-4 py-2 text-right">Revenue (30d)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.islandBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No data yet.
                  </td>
                </tr>
              ) : (
                metrics.islandBreakdown.map((row) => {
                  const island = getIslandByCode(row.island);
                  return (
                    <tr key={row.island} className="border-t">
                      <td className="px-4 py-2">
                        <span className="mr-2">{island?.flag ?? "🏝"}</span>
                        {island?.name ?? row.island}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{row.events}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatTTD(row.revenueCents)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  count,
  label,
  tone,
}: {
  href: string;
  count: number;
  label: string;
  tone: "default" | "warn" | "danger";
}) {
  return (
    <Link href={href} className="block">
      <div
        className={
          "rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/30 " +
          (tone === "warn"
            ? "border-amber-500/40 bg-amber-500/5"
            : tone === "danger"
              ? "border-red-500/40 bg-red-500/5"
              : "")
        }
      >
        <div className="text-3xl font-bold">{count}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
    </Link>
  );
}
