import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // skipQ brand palette — stone/charcoal base + teal accent (per spec §4)
        skip: {
          ink: "#0E1116",
          slate: "#1F242C",
          stone: "#6B7280",
          mist: "#F4F5F7",
          accent: "#0F8B8D",
          accentHi: "#13B0B2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
