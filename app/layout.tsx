import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
import { AnalyticsScript } from "@/components/analytics-script";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "WeFetePass — Trini fete tickets & digital passes",
    template: "%s · WeFetePass",
  },
  description:
    "WeFetePass is Trinidad & Tobago's digital fete pass platform. Discover fetes, buy tickets, get QR passes, and breeze through the gate.",
  openGraph: {
    title: "WeFetePass",
    description: "Trini fete tickets and digital passes. Mobile-first, secure, ready for Carnival.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans min-h-dvh`}>
        {children}
        <Toaster richColors closeButton position="top-center" />
        <AnalyticsScript />
      </body>
    </html>
  );
}
