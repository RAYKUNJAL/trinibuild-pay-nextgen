import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in — WeFetePass" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Card className="border-border/60 bg-background/95 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll text you a 6-digit code. No password needed.
        </p>
        <div className="mt-6">
          <SignInFormWrapper searchParams={searchParams} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          First time?{" "}
          <Link href="/sign-up" className="font-medium text-brand-red hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

async function SignInFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignInForm nextPath={next} />;
}
