import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for every admin route — requires the caller to be authenticated and
 * have `role === 'admin'` on their `profiles` row.
 *
 * Use as the first call in any admin page / API handler:
 *
 *     const { user, profile } = await requireAdmin();
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as { id: string; role: string; full_name: string | null } | null;
  if (!p || p.role !== "admin") redirect("/");
  return { user, profile: p };
}
