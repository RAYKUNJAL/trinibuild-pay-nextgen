import Link from "next/link";
import { readSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const session = await readSessionFromCookie();
  if (!session) return null;

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [all, verified, failed, recent] = await Promise.all([
    prisma.verification.count({
      where: { tenantId: session.tenantId, createdAt: { gte: since } },
    }),
    prisma.verification.count({
      where: { tenantId: session.tenantId, status: "VERIFIED", createdAt: { gte: since } },
    }),
    prisma.verification.count({
      where: { tenantId: session.tenantId, status: "FAILED", createdAt: { gte: since } },
    }),
    prisma.verification.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const successRate = all === 0 ? 0 : Math.round((verified / all) * 100);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            Month-to-date usage. Switch tier or add seats in workspace settings.
          </p>
        </div>
        <Link
          href="/dashboard/keys"
          className="inline-flex rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Create API key →
        </Link>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Verifications (MTD)" value={all.toLocaleString()} />
        <Stat label="Verified" value={verified.toLocaleString()} accent="brand" />
        <Stat label="Failed" value={failed.toLocaleString()} accent="red" />
        <Stat label="Success rate" value={`${successRate}%`} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink-900">Recent activity</h2>
        <div className="mt-4 rounded-xl bg-white border border-ink-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-ink-500" colSpan={5}>
                    No verifications yet — POST to <code>/api/v1/verifications</code> to get started.
                  </td>
                </tr>
              )}
              {recent.map((v) => (
                <tr key={v.id} className="border-t border-ink-100">
                  <td className="px-4 py-3 font-mono text-xs">{v.reference}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    {(v.amountMinor / 100).toFixed(2)} {v.currency}
                  </td>
                  <td className="px-4 py-3">{v.bankCode} · ••••{v.accountNumber}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {v.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "brand" | "red";
}) {
  const color =
    accent === "brand" ? "text-brand-700" : accent === "red" ? "text-red-600" : "text-ink-900";
  return (
    <div className="rounded-xl bg-white border border-ink-100 p-5">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    VERIFIED: "bg-brand-50 text-brand-700",
    FAILED: "bg-red-50 text-red-700",
    PENDING: "bg-ink-100 text-ink-500",
    EXPIRED: "bg-ink-100 text-ink-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-ink-100"}`}>
      {status.toLowerCase()}
    </span>
  );
}
