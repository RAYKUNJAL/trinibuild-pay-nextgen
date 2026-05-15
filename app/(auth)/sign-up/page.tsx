import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RolePicker } from "../_components/role-picker";
import { AttendeeSignUpForm } from "./attendee-form";
import { PromoterSignUpForm } from "./promoter-form";

export const metadata = { title: "Sign up — WeFetePass" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  if (role !== "attendee" && role !== "promoter") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">Join WeFetePass</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us how you&apos;ll be using the platform.
          </p>
        </div>
        <RolePicker />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand-red hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <Card className="border-border/60 bg-background/95 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        {role === "attendee" ? <AttendeeSignUpForm /> : <PromoterSignUpForm />}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Wrong role?{" "}
          <Link href="/sign-up" className="font-medium text-brand-red hover:underline">
            Switch
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
