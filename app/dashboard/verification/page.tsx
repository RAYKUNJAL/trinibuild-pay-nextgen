import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerificationContent } from "./verification-content";

export const metadata: Metadata = {
  title: "Verification — WeFetePass Dashboard",
  description: "Apply for the Verified Promoter badge to unlock lower platform fees and higher buyer trust.",
};

type VerificationRecord = {
  id: string;
  status: "not_applied" | "pending" | "approved" | "rejected";
  legal_name: string | null;
  business_reg_number: string | null;
  id_document_url: string | null;
  social_proof_urls: string[];
  admin_note: string | null;
  created_at: string;
};

export default async function VerificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/dashboard/verification");
  }

  // Fetch existing verification record if any
  const { data: rawRecord } = await supabase
    .from("promoter_verifications")
    .select("id, status, legal_name, business_reg_number, id_document_url, social_proof_urls, admin_note, created_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  const record: VerificationRecord | null = rawRecord
    ? {
        ...rawRecord,
        social_proof_urls: Array.isArray(rawRecord.social_proof_urls)
          ? (rawRecord.social_proof_urls as string[])
          : [],
      }
    : null;

  return <VerificationContent record={record} />;
}
