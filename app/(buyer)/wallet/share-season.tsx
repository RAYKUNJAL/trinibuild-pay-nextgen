"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareSeasonButton({ upcomingCount, venues }: { upcomingCount: number; venues: string[] }) {
  async function onShare() {
    const text =
      `My Fete Season: ${upcomingCount} fete${upcomingCount === 1 ? "" : "s"} locked in` +
      (venues.length ? ` — ${venues.slice(0, 3).join(", ")}` : "") +
      ". Get yours on WeFetePass.";
    try {
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ title: "My Fete Season", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Copied — share it with your crew");
    } catch {
      // user cancelled
    }
  }
  return (
    <Button type="button" size="sm" variant="outline" onClick={onShare} className="gap-2">
      <Share2 className="h-4 w-4" aria-hidden />
      Share
    </Button>
  );
}
