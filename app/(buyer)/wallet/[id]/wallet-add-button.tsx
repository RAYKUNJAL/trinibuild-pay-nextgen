"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WalletAddButtonProps {
  passId: string;
  holderName: string;
  /** Whether APPLE_WALLET_CERT is set on the server. */
  appleEnabled?: boolean;
  /** Whether GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY is set on the server. */
  googleEnabled?: boolean;
}

type AppleWalletResponse = {
  configured: boolean;
  preview?: unknown;
  message?: string;
};

type GoogleWalletResponse = {
  configured: boolean;
  saveUrl: string | null;
  objectId: string;
};

/** Apple Wallet logo — monochrome SVG matching the official badge spec */
function AppleWalletLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/** Google Wallet badge — coloured "G" mark */
function GoogleWalletLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function WalletAddButton({
  passId,
  holderName,
  appleEnabled = false,
  googleEnabled = false,
}: WalletAddButtonProps) {
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If neither integration is configured, render nothing — the server page
  // shows a small "coming soon" note instead.
  if (!appleEnabled && !googleEnabled) return null;

  async function handleAppleWallet() {
    setAppleLoading(true);
    try {
      const res = await fetch(`/api/passes/${passId}/apple-wallet`);

      if (res.status === 202) {
        const body = (await res.json()) as AppleWalletResponse;
        if (!body.configured) {
          toast.info(
            body.message ??
              "Apple Wallet coming soon — your QR pass works at the door",
          );
        }
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(body.error ?? "Failed to generate Apple Wallet pass");
        return;
      }

      // Configured — trigger download of the .pkpass blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wefetepass.pkpass";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Apple Wallet pass downloaded!");
    } catch (err) {
      console.error("[apple-wallet]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleGoogleWallet() {
    setGoogleLoading(true);
    try {
      const res = await fetch(`/api/passes/${passId}/google-wallet`);
      const body = (await res.json().catch(() => ({}))) as GoogleWalletResponse;

      if (!res.ok) {
        toast.error(
          (body as unknown as { error?: string }).error ??
            "Failed to generate Google Wallet pass",
        );
        return;
      }

      if (body.saveUrl) {
        window.open(body.saveUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.info(
          "Google Wallet coming soon — your QR pass works at the door",
        );
      }
    } catch (err) {
      console.error("[google-wallet]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row"
      aria-label={`Wallet options for ${holderName}`}
    >
      {/* Apple Wallet button — black pill matching Apple brand guidelines.
          Only rendered when APPLE_WALLET_CERT is set server-side. */}
      {appleEnabled ? (
        <button
          type="button"
          onClick={() => void handleAppleWallet()}
          disabled={appleLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full",
            "bg-black px-5 py-2.5 text-sm font-semibold text-white",
            "border border-black",
            "transition-opacity hover:opacity-80 active:opacity-60",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <AppleWalletLogo />
          {appleLoading ? "Loading…" : "Add to Apple Wallet"}
        </button>
      ) : null}

      {/* Google Wallet button — white with Google colours.
          Only rendered when GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY is set. */}
      {googleEnabled ? (
        <button
          type="button"
          onClick={() => void handleGoogleWallet()}
          disabled={googleLoading}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full",
            "bg-white px-5 py-2.5 text-sm font-semibold text-[#3c4043]",
            "border border-[#dadce0]",
            "transition-colors hover:bg-[#f8f9fa] active:bg-[#e8eaed]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <GoogleWalletLogo />
          {googleLoading ? "Loading…" : "Save to Google Wallet"}
        </button>
      ) : null}
    </div>
  );
}
