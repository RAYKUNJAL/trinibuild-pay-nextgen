import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "My profile" };

async function updateProfile(formData: FormData) {
  "use server";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ full_name: fullName || null }).eq("id", user.id);
  revalidatePath("/profile");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user!.id)
    .maybeSingle();

  const { count: attendedCount } = await supabase
    .from("passes")
    .select("id", { count: "exact", head: true })
    .eq("status", "used");

  const verified = (attendedCount ?? 0) >= 1;
  const reputationScore = Math.min(100, 40 + (attendedCount ?? 0) * 8);

  return (
    <div className="max-w-2xl">
      <PageHeader title="My profile" description="Your buyer identity across WeFetePass." />

      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl font-semibold">{profile?.full_name ?? "Add your name"}</div>
              <div className="text-sm text-muted-foreground">{profile?.phone ?? user?.email ?? "No contact on file"}</div>
              <div className="mt-2 flex gap-2">
                {verified ? (
                  <Badge className="bg-emerald-100 text-emerald-900">Verified Buyer</Badge>
                ) : (
                  <Badge variant="secondary">New buyer</Badge>
                )}
                <Badge variant="outline">Reputation {reputationScore}</Badge>
              </div>
            </div>
          </div>
          <Separator className="my-5" />
          <form action={updateProfile} className="space-y-3">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
            </div>
            <Button type="submit" className="bg-brand-red text-white hover:bg-brand-red/90">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-semibold">Fete history</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {attendedCount ?? 0} fete{(attendedCount ?? 0) === 1 ? "" : "s"} attended. Stack scans to unlock
            fast-track entry at participating venues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
