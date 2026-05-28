"use client";

export function PosterActions() {
  return (
    <button type="button" onClick={() => window.print()} className="skip-btn-primary">
      Print / Save as PDF
    </button>
  );
}
