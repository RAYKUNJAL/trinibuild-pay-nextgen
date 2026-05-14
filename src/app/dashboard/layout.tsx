import Link from "next/link";
import { redirect } from "next/navigation";
import { readSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, slug: true, tier: true, status: true },
  });
  if (!tenant) redirect("/login");

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-100">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-ink-900">
              <span className="inline-block h-7 w-7 rounded-lg bg-brand-500" />
              CashConnect
            </Link>
            <nav className="flex items-center gap-5 text-sm text-ink-500">
              <Link href="/dashboard" className="hover:text-ink-900">Overview</Link>
              <Link href="/dashboard/keys" className="hover:text-ink-900">API keys</Link>
              <Link href="/docs" className="hover:text-ink-900">Docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium text-ink-900">{tenant.name}</div>
              <div className="text-xs text-ink-500">
                {tenant.tier.replace("_", " ").toLowerCase()} · {tenant.status.toLowerCase()}
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="text-sm text-ink-500 hover:text-ink-900">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
