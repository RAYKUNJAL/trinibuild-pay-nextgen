import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";

export default function EventNotFound() {
  return (
    <Section>
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">This fete moved on</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn&apos;t find that event. It may have ended, been unpublished, or the link is off.
        </p>
        <div className="mt-6">
          <Button asChild className="bg-brand-red text-white hover:bg-brand-red/90">
            <Link href="/discover">Browse fetes</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
