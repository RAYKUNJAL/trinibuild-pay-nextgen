import Link from "next/link";
import { PartyPopper, Megaphone, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tiles = [
  {
    href: "/sign-up?role=attendee",
    title: "I'm coming to fete",
    description: "Browse events, pay by bank transfer, and get your QR ticket on WhatsApp.",
    cta: "Sign up as a fete-goer",
    Icon: PartyPopper,
  },
  {
    href: "/sign-up?role=promoter",
    title: "I'm running events",
    description: "Sell tickets, manage door ops, and use AI tools built for T&T promoters.",
    cta: "Sign up as a promoter",
    Icon: Megaphone,
  },
];

export function RolePicker() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tiles.map(({ href, title, description, cta, Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full border-border/60 transition-all group-hover:border-brand-red/40 group-hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-red">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
