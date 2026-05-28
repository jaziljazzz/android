"use client";

import { useState } from "react";

export function ReferralShare({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://skipq-partner.vercel.app";
  const message = `Skip the salon queue with me on SkipQ. Use my code ${code} when you sign up: ${base}`;

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        /* user dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="skip-btn-primary mt-5 inline-flex items-center gap-2 active:opacity-70"
    >
      {copied ? "Copied" : "Share"}
    </button>
  );
}
