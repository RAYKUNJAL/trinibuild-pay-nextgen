import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BuyerNav } from "@/components/buyer-nav";
import { createClient } from "@/lib/supabase/server";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? "/wallet";
    redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100dvh-4rem)]">
        <div className="container flex gap-8 py-8">
          <BuyerNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
