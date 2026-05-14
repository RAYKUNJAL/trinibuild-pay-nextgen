import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d6f7e8",
          500: "#11b981",
          600: "#0fa674",
          700: "#0c8a60",
          900: "#063b29",
        },
        ink: {
          50: "#f8fafc",
          100: "#eef2f6",
          500: "#64748b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
