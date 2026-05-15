import Link from "next/link";
import { requireAdmin } from "../_lib/auth";
import { listPendingVerifications } from "../_lib/queries";

export const metadata = { title: "Verifications — Admin" };

export default async function VerificationsPage() {
  await requireAdmin();
  const rows = await listPendingVerifications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promoter verifications</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} pending application{rows.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Promoter</th>
              <th className="px-4 py-2 text-left">Legal name</th>
              <th className="px-4 py-2 text-left">Submitted</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No pending verifications.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.profile?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.profile?.phone ?? r.profile_id}
                    </div>
                  </td>
                  <td className="px-4 py-2">{r.legal_name ?? "—"}</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/verifications/${r.id}`}
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
