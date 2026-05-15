import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WeFetePass — Caribbean fete tickets, AI-powered";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #030303 0%, #1a0f0a 45%, #2a1812 70%, #030303 100%)",
          color: "#f5dfb7",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E40C2B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "white",
            }}
          >
            W
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
            WeFetePass
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#d8ab5b",
            }}
          >
            Caribbean Fetes & Carnival 2027
          </div>
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#f2d9ad",
              maxWidth: 950,
            }}
          >
            Your fete ticket, sorted.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.3,
              color: "#e8dfd2",
              opacity: 0.82,
              maxWidth: 880,
            }}
          >
            Pay by bank transfer. Get your QR on WhatsApp. Walk straight in.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 18,
            color: "#d8ab5b",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span>🇹🇹 Trinidad</span>
          <span>🇯🇲 Jamaica</span>
          <span>🇧🇧 Barbados</span>
          <span>🇬🇩 Grenada</span>
          <span style={{ opacity: 0.6 }}>+ 8 more</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
