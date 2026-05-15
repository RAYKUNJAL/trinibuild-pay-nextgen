"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type BrandValues = {
  brand_name: string;
  logo_url: string;
  bio: string;
  instagram: string;
  tiktok: string;
  website: string;
  whatsapp_notifications: boolean;
};

export function BrandForm({ initial }: { initial: BrandValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BrandValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof BrandValues>(key: K, value: BrandValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: values });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Brand profile saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand_name">Brand name</Label>
          <Input
            id="brand_name"
            value={values.brand_name}
            onChange={(e) => set("brand_name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            type="url"
            value={values.logo_url}
            onChange={(e) => set("logo_url", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={values.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="@handle"
          />
        </div>
        <div>
          <Label htmlFor="tiktok">TikTok</Label>
          <Input
            id="tiktok"
            value={values.tiktok}
            onChange={(e) => set("tiktok", e.target.value)}
            placeholder="@handle"
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.whatsapp_notifications}
          onChange={(e) => set("whatsapp_notifications", e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <span>Send me operational updates on WhatsApp</span>
      </label>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-brand-red text-white hover:bg-brand-red/90"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Save changes
        </Button>
      </div>
    </form>
  );
}
