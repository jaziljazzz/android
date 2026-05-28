"use client";

export function LocationPill({ defaultLabel }: { defaultLabel: string }) {
  return <span className="truncate max-w-[150px]">{defaultLabel}</span>;
}
