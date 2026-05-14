import Link from "next/link";

export function SiteNav() {
  return (
    <header className="border-b border-ink-100">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink-900">
          <span className="inline-block h-7 w-7 rounded-lg bg-brand-500" />
          CashConnect
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-ink-500">
          <Link href="/pricing" className="hover:text-ink-900">Pricing</Link>
          <Link href="/docs" className="hover:text-ink-900">Docs</Link>
          <Link href="/dashboard" className="hover:text-ink-900">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-500 hover:text-ink-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-md bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-ink-500 flex flex-wrap items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} CashConnect Caribbean. Bank-verified payments for 3B+ underbanked.</div>
        <div className="flex gap-6">
          <Link href="/pricing" className="hover:text-ink-900">Pricing</Link>
          <Link href="/docs" className="hover:text-ink-900">Docs</Link>
          <Link href="/dashboard" className="hover:text-ink-900">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
