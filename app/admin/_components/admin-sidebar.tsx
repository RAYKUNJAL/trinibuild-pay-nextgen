"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Receipt,
  RefreshCcw,
  Users,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  counts: {
    verifications: number;
    receipts: number;
    refunds: number;
    users: number;
  };
}

export function AdminSidebar({ counts }: AdminSidebarProps) {
  const pathname = usePathname();

  const items: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
    exact?: boolean;
  }> = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck, badge: counts.verifications },
    { href: "/admin/receipts", label: "Receipts", icon: Receipt, badge: counts.receipts },
    { href: "/admin/refunds", label: "Refunds", icon: RefreshCcw, badge: counts.refunds },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  ];

  return (
    <aside className="hidden md:block w-60 shrink-0 border-r border-slate-800 bg-slate-950/40">
      <nav className="sticky top-16 flex flex-col gap-1 p-3" aria-label="Admin navigation">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs font-semibold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
