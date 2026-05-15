"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SendWhatsappButton({ passId }: { passId: string }) {
  const [loading, setLoading] = useState(false);
  async function onSend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/passes/${passId}/send-whatsapp`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Sent to your WhatsApp");
    } catch {
      toast.error("Couldn't send — try again in a moment");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button type="button" variant="outline" onClick={onSend} disabled={loading} className="gap-2">
      <MessageCircle className="h-4 w-4" aria-hidden />
      {loading ? "Sending…" : "Send via WhatsApp"}
    </Button>
  );
}
