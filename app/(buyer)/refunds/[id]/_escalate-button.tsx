"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function EscalateButton({ refundId }: { refundId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEscalate() {
    if (
      !confirm(
        "Escalate this refund to a WeFetePass dispute? Our team will review within 5 business days.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/refunds/${refundId}/escalate`, {
        method: "POST",
      });
      const json = (await res.json()) as { disputeId?: string; error?: string };

      if (!res.ok) {
        setError(json.error ?? "Failed to escalate. Please try again.");
        return;
      }

      router.refresh();
      router.push(`/refunds/${refundId}/dispute`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleEscalate}
        disabled={loading}
        className="border-red-200 text-red-700 hover:bg-red-50"
      >
        <AlertTriangle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {loading ? "Escalating…" : "Escalate to Dispute"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
