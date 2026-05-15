import Link from "next/link";
import { Instagram, Facebook, Twitter, Music2 } from "lucide-react";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/discover", label: "Find Events" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/wallet", label: "My Wallet" },
      { href: "/orders", label: "Orders" },
    ],
  },
  {
    title: "Promoters",
    links: [
      { href: "/promoters", label: "Sell Tickets" },
      { href: "/promoters#tools", label: "Promoter Tools" },
      { href: "/promoters#pricing", label: "Pricing" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/support", label: "Support" },
      { href: "/contact", label: "Contact" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/refunds", label: "Refunds" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
];

const socials = [
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
  { href: "https://twitter.com", label: "Twitter", Icon: Twitter },
  { href: "https://tiktok.com", label: "TikTok", Icon: Music2 },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold">
              We<span className="text-brand-red">Fete</span>Pass
            </span>
            <span className="text-sm text-muted-foreground">— Built for Trinidad &amp; Tobago</span>
          </div>
          <div className="flex items-center gap-3">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">© {year} WeFetePass. All rights reserved.</p>
      </div>
    </footer>
  );
}
