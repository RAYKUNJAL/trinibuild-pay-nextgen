"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const leftLinks = [
  { href: "/discover", label: "Find Events" },
  { href: "/how-it-works", label: "How it works" },
];

const promoterMenu = [
  { href: "/promoters", label: "Sell Tickets" },
  { href: "/promoters#tools", label: "Promoter Tools" },
  { href: "/promoters#pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/60",
        "bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-xl font-bold tracking-tight" aria-label="WeFetePass home">
            We<span className="text-brand-red">Fete</span>Pass
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {leftLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                For Promoters
                <ChevronDown className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {promoterMenu.map((m) => (
                <DropdownMenuItem key={m.href} asChild>
                  <Link href={m.href}>{m.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/support">Support</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">
                We<span className="text-brand-red">Fete</span>Pass
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden />
              </Button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {leftLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 px-3 text-xs uppercase tracking-wide text-muted-foreground">For Promoters</div>
              {promoterMenu.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {m.label}
                </Link>
              ))}
              <Link
                href="/support"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Support
              </Link>
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-brand-red text-white hover:bg-brand-red/90"
                onClick={() => setMobileOpen(false)}
              >
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
