import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How WeFetePass collects, uses, and protects your personal information in Trinidad & Tobago.",
};

const sections: { id: string; title: string; body: string }[] = [
  {
    id: "what-we-collect",
    title: "1. What We Collect",
    body:
      "Account info (name, phone, email), payment receipts (bank-transfer screenshots or references), ticket purchase history, scanner activity, and basic device/log information. Promoters also provide business and payout details.",
  },
  {
    id: "how-we-use-it",
    title: "2. How We Use It",
    body:
      "To process ticket sales, deliver QR passes by WhatsApp, verify receipts, detect fraud, run payouts, support you, and improve the platform. We do not sell your personal information.",
  },
  {
    id: "sharing",
    title: "3. Who We Share It With",
    body:
      "With promoters (for the events you buy from), with payment and bank verification partners, and with service providers that help us operate (hosting, messaging, analytics). We require all partners to handle your data responsibly.",
  },
  {
    id: "whatsapp",
    title: "4. WhatsApp Delivery",
    body:
      "Tickets and order updates are delivered to the WhatsApp number you provide at checkout. You can opt out of non-essential marketing messages at any time; transactional messages may continue.",
  },
  {
    id: "retention",
    title: "5. Retention",
    body:
      "We retain account and transaction records for as long as your account is active and as required by Trinidad &amp; Tobago law. You may request deletion of non-essential data at any time.",
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    body:
      "You can access, correct, or delete your personal information by contacting help@wefetepass.com. We respond within a reasonable timeframe.",
  },
  {
    id: "contact",
    title: "7. Contact",
    body:
      "Questions about this policy? Email help@wefetepass.com.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl">
        <Badge variant="outline" className="mb-4">Legal</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
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
