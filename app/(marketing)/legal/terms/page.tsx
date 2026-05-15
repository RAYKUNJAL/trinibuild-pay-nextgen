import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "WeFetePass Terms of Service — tickets, refunds, fraud, IP, and governing law for Trinidad & Tobago.",
};

const sections: { id: string; title: string; body: string }[] = [
  {
    id: "tickets",
    title: "1. Tickets and Use",
    body:
      "Tickets purchased on WeFetePass are licences to attend a specific event under the terms set by the promoter. Each QR code is single-use and may be invalidated on first scan. Resale outside the platform may void the ticket.",
  },
  {
    id: "refunds",
    title: "2. Refunds and Cancellations",
    body:
      "Refund eligibility is set by each promoter and shown on the event page. In the event of a cancellation by the promoter, WeFetePass will facilitate a full refund of the ticket price and any platform fees. Duplicate charges and verified fraud are always refundable.",
  },
  {
    id: "fraud",
    title: "3. Fraud, Receipts and Verification",
    body:
      "All bank-transfer receipts are subject to automated and manual review. Submission of falsified bank receipts, screenshots, or impersonation of a financial institution constitutes fraud and may result in account suspension and referral to local authorities.",
  },
  {
    id: "ip",
    title: "4. Intellectual Property",
    body:
      "Promoters retain ownership of their event content (flyers, photos, copy). By uploading, you grant WeFetePass a non-exclusive licence to host, distribute, and promote that content on the platform. The WeFetePass name, logo, and software are owned by WeFetePass.",
  },
  {
    id: "governing-law",
    title: "5. Governing Law",
    body:
      "These Terms are governed by the laws of the Republic of Trinidad and Tobago. Any disputes will be resolved in the courts of Trinidad and Tobago.",
  },
  {
    id: "changes",
    title: "6. Changes to These Terms",
    body:
      "We may update these Terms from time to time. Material changes will be communicated by email or in-app notice at least 14 days before they take effect.",
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl">
        <Badge variant="outline" className="mb-4">Legal</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Placeholder draft for review. Pending counsel review by a Trinidad &amp; Tobago–qualified attorney before launch.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="font-display text-2xl font-bold">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
