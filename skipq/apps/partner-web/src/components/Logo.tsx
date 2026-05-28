interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

/**
 * SkipQ wordmark per brand sheet: "Skip" in ink, "Q" in coral.
 * Use variant="light" on dark backgrounds (the "Skip" becomes white).
 */
export function Logo({ size = "md", variant = "default", className = "" }: LogoProps) {
  const skipColor = variant === "light" ? "text-white" : "text-skip-ink";
  return (
    <span
      className={`inline-flex items-baseline font-extrabold tracking-tight ${SIZE_CLASSES[size]} ${className}`}
    >
      <span className={skipColor}>Skip</span>
      <span className="text-skip-accent">Q</span>
    </span>
  );
}

/** Compact mark for tight spots (favicons, badges, etc.) — just the Q. */
export function LogoMark({ size = "md", className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-skip-accent text-white font-extrabold ${
        size === "sm" ? "w-7 h-7 text-base" : size === "lg" ? "w-12 h-12 text-2xl" : "w-9 h-9 text-lg"
      } ${className}`}
    >
      Q
    </span>
  );
}
