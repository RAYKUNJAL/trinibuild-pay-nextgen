"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function BankDetailsForm() {
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/payouts/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, account, holder }),
      });
      if (res.status === 404 || res.status === 501) {
        toast.message("Coming soon", {
          description: "Bank payouts unlock once your first event is approved.",
        });
        return;
      }
      if (!res.ok) {
        toast.error("Could not save bank details");
        return;
      }
      toast.success("Bank details saved");
    } catch {
      toast.message("Coming soon", {
        description: "Bank payouts unlock once your first event is approved.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="bank">Bank</Label>
        <Input
          id="bank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder="Republic Bank"
        />
      </div>
      <div>
        <Label htmlFor="account">Account number</Label>
        <Input
          id="account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          inputMode="numeric"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="holder">Account holder</Label>
        <Input
          id="holder"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Business legal name"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button
          type="submit"
          disabled={submitting || !bank || !account || !holder}
          className="bg-brand-red text-white hover:bg-brand-red/90"
        >
          Save bank details
        </Button>
      </div>
    </form>
  );
}
