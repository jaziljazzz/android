/** Shared visual tokens — mirrors the partner-web tailwind palette. */
export const colors = {
  ink: "#1A1F2E",
  slate: "#4A6E8B",
  stone: "#8E9AAB",
  mist: "#F2F3F5",
  white: "#FFFFFF",
  accent: "#FF5454",
  accentHi: "#FF6E6E",
  accentLo: "#FFE5E5",
  success: "#28C58A",
  successLo: "#DFF5EB",
  caution: "#F5A524",
  cautionLo: "#FEF1DC",
  border: "rgba(142,154,171,0.18)",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: "#1A1F2E",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;
