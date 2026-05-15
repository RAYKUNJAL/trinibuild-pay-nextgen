import { CalendarSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsappCapture } from "@/components/whatsapp-capture";

export function EmptyEvents({ city }: { city?: string }) {
  return (
    <Card className="mx-auto max-w-xl border-dashed border-border/70">
      <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
          <CalendarSearch className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold">First fetes dropping soon.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your number and we'll text you when tickets go live{city ? ` in ${city}` : ""}.
          </p>
        </div>
        <div className="w-full text-left">
          <WhatsappCapture eventCity={city} />
        </div>
      </CardContent>
    </Card>
  );
}
