import Link from "next/link";
import { requireAdmin } from "./_lib/auth";
import { getSidebarCounts } from "./_lib/queries";
import { AdminSidebar } from "./_components/admin-sidebar";

export const metadata = { title: "Admin — WeFetePass" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const counts = await getSidebarCounts();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Dark top bar — visually distinct from organizer dashboard. */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-slate-100">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display text-lg font-bold tracking-tight text-white">
              WeFetePass
            </Link>
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Switch to Organizer Dashboard
            </Link>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-400">Signed in as</span>
              <span className="text-sm font-medium text-white">
                {profile.full_name ?? "Admin"}
              </span>
            </div>
            <form action="/sign-out" method="post">
              <button
                type="submit"
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-4rem)]">
        <AdminSidebar counts={counts} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
