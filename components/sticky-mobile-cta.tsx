"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href="/discover"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-red text-sm font-semibold text-white shadow-lg hover:bg-brand-red/90"
      >
        Find your next fete
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
