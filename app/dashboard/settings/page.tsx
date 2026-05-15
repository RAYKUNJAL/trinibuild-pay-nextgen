import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../_components/page-header";
import { getCurrentPromoter } from "../_lib/queries";
import { BrandForm } from "./brand-form";

export const metadata = { title: "Settings — WeFetePass" };

export default async function SettingsPage() {
  const promoter = await getCurrentPromoter();
  if (!promoter?.user) return null;
  const meta = promoter.user.user_metadata ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your brand, notifications, and team."
      />

      <Card className="border-border/60">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Brand profile</h2>
          <BrandForm
            initial={{
              brand_name: (meta.brand_name as string | undefined) ?? "",
              logo_url: (meta.logo_url as string | undefined) ?? "",
              bio: (meta.bio as string | undefined) ?? "",
              instagram: (meta.instagram as string | undefined) ?? "",
              tiktok: (meta.tiktok as string | undefined) ?? "",
              website: (meta.website as string | undefined) ?? "",
              whatsapp_notifications:
                (meta.whatsapp_notifications as boolean | undefined) ?? true,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">
            Invite door staff and box-office collaborators. Scanner-only roles coming soon.
          </p>
          <button
            disabled
            className="rounded-md border border-dashed border-border/60 px-3 py-1.5 text-sm text-muted-foreground"
          >
            Invite teammate — coming soon
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
