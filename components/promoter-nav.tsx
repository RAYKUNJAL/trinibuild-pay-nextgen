"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ScanLine,
  BarChart3,
  Banknote,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/events", label: "Events", Icon: CalendarDays },
  { href: "/dashboard/crm", label: "CRM", Icon: Users },
  { href: "/dashboard/scanner", label: "Scanner", Icon: ScanLine },
  { href: "/dashboard/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/dashboard/payouts", label: "Payouts", Icon: Banknote },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PromoterNav() {
  const pathname = usePathname() ?? "";
  return (
    <>
      <aside className="hidden md:block w-56 shrink-0">
        <nav className="sticky top-20 flex flex-col gap-1" aria-label="Promoter navigation">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-brand-red/10 text-brand-red"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Promoter navigation"
        className="md:hidden sticky top-16 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur"
      >
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                active
                  ? "bg-brand-red text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
