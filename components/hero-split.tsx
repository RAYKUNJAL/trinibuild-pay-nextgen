import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="rounded-full border-border/60 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
      {children}
    </Badge>
  );
}

export function HeroSplit() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 gradient-fete opacity-90",
        )}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_60%)]" />

      <div className="container grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col items-start">
          <Chip>For party goers</Chip>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Find your next fete.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Browse events, pay by bank transfer, get your QR ticket. No stress.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-brand-red text-white hover:bg-brand-red/90"
          >
            <Link href="/discover">
              Explore events
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-start md:items-end md:text-right">
          <Chip>For promoters</Chip>
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Your next event, fully loaded.
          </h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Tickets, flyers, VIP, door ops, and AI tools — all from one platform built for T&amp;T.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-8">
            <Link href="/promoters">
              Start selling
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
