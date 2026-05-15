"use client";

import { useEffect, useState } from "react";
import { qrDataUrl } from "@/lib/qr";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function QrDisplay({
  value,
  size = 240,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(null);
    qrDataUrl(value)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to generate QR");
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 text-xs text-destructive",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return <Skeleton className={cn("rounded-md", className)} style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={cn("rounded-md bg-white p-2", className)}
    />
  );
}
