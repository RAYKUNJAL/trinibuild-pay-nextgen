"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButton({ title, text, url }: { title: string; text?: string; url: string }) {
  async function onShare() {
    const data = { title, text, url };
    try {
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — send it to your crew");
    } catch {
      // user cancelled
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onShare} className="gap-2">
      <Share2 className="h-4 w-4" aria-hidden />
      Share with crew
    </Button>
  );
}
