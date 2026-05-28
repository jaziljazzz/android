import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // SkipQ brand palette
        skip: {
          // Ink — dominant text + dark backgrounds (was deep charcoal)
          ink: "#1A1F2E",
          // Slate — muted secondary text + borders, slight blue cast
          slate: "#4A6E8B",
          // Stone — tertiary text, dividers
          stone: "#8E9AAB",
          // Mist — page background
          mist: "#F2F3F5",
          // Coral — primary brand accent + CTAs
          accent: "#FF5454",
          accentHi: "#FF6E6E",
          accentLo: "#FFE5E5",
          // Success — confirmed states (booking confirmed, low wait)
          success: "#28C58A",
          successLo: "#DFF5EB",
          // Caution — arrived, on break
          caution: "#F5A524",
          cautionLo: "#FEF1DC",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,31,46,0.04), 0 2px 8px rgba(26,31,46,0.04)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
