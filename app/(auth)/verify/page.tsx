import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verify — WeFetePass" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; next?: string }>;
}) {
  const { phone, next } = await searchParams;
  return (
    <Card className="border-border/60 bg-background/95 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Enter your code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We texted a 6-digit code to your phone. Pop it in below.
        </p>
        <div className="mt-6">
          <VerifyForm initialPhone={phone ?? ""} nextPath={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Didn&apos;t get it?{" "}
          <Link href="/sign-in" className="font-medium text-brand-red hover:underline">
            Resend
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
