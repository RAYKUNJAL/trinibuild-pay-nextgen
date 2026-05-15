import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../_lib/auth";
import { getUser } from "../../_lib/queries";
import { MetricCard } from "../../_components/metric-card";

export const metadata = { title: "User detail — Admin" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { profile, ordersCount, passesCount, eventsCount } = await getUser(id);
  if (!profile) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:underline">
          ← Back to search
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {profile.full_name ?? "Unnamed user"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.role} · joined {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">User ID</dt>
          <dd className="font-mono text-xs">{profile.id}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{profile.phone ?? "—"}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd>{profile.role}</dd>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Orders placed" value={ordersCount} />
        <MetricCard label="Passes held" value={passesCount} />
        <MetricCard label="Events organized" value={eventsCount} />
      </div>
    </div>
  );
}
