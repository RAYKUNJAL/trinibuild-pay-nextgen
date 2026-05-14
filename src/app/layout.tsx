import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashConnect — Bank-verified payments for emerging markets",
  description:
    "Multi-tenant SaaS for cash-to-digital payment verification. License our infrastructure across 50+ countries.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
