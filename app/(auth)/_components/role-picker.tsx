import Link from "next/link";
import { Ticket, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RolePicker() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/sign-up?role=attendee"
        className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <Card className="h-full border-border/60 transition-shadow group-hover:shadow-md">
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Ticket className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold">I&apos;m here for the fete</h2>
            <p className="text-sm text-muted-foreground">
              Browse events, pay by bank transfer, get your QR ticket on WhatsApp.
            </p>
            <span className="mt-auto text-sm font-medium text-brand-red">Sign up to buy tickets →</span>
          </CardContent>
        </Card>
      </Link>

      <Link
        href="/sign-up?role=promoter"
        className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <Card className="h-full border-border/60 transition-shadow group-hover:shadow-md">
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Megaphone className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="font-display text-lg font-semibold">I&apos;m throwing fetes</h2>
            <p className="text-sm text-muted-foreground">
              Sell tickets, design flyers, run the door — all from one dashboard.
            </p>
            <span className="mt-auto text-sm font-medium text-brand-red">Apply to sell tickets →</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
