"use client";

import { useEffect, useRef } from "react";
import type { Placement } from "@/lib/placements";

function trackEvent(id: string, event: "impression" | "click") {
  try {
    fetch("/api/placements/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function BrandStrip({
  placements,
  title = "Sponsored picks",
}: {
  placements: Placement[];
  title?: string;
}) {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const p of placements) {
      if (!seenRef.current.has(p.id)) {
        seenRef.current.add(p.id);
        trackEvent(p.id, "impression");
      }
    }
  }, [placements]);

  if (!placements.length) return null;

  return (
    <section className="mt-7 -mx-5">
      <div className="px-5 flex items-baseline justify-between">
        <h3 className="text-base font-extrabold text-skip-ink uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-[10px] tracking-[0.18em] font-bold text-skip-stone">
          AD
        </span>
      </div>

      <div
        className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {placements.map((p) => (
          <a
            key={p.id}
            href={p.cta_url ?? "#"}
            onClick={() => trackEvent(p.id, "click")}
            className="shrink-0 w-[160px] rounded-2xl overflow-hidden shadow-card active:opacity-85"
            style={{
              background: p.bg_color,
              color: p.fg_color,
              scrollSnapAlign: "start",
            }}
          >
            <div
              className="relative w-full aspect-square overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${p.bg_color} 0%, ${shade(p.bg_color, -22)} 100%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.media_url}
                alt={p.copy_title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, ${p.bg_color} 100%)`,
                }}
              />
              <span
                className="absolute top-2 left-2 text-[9px] tracking-[0.18em] font-bold px-1.5 py-0.5 rounded"
                style={{ background: p.accent_color, color: p.bg_color }}
              >
                AD
              </span>
            </div>
            <div className="p-2.5">
              <p
                className="text-[10px] tracking-[0.14em] font-bold opacity-70 truncate"
                style={{ color: p.fg_color }}
              >
                {p.brand_name}
              </p>
              <p
                className="text-[13px] font-extrabold leading-tight mt-0.5"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {p.copy_title}
              </p>
              {p.copy_subtitle ? (
                <p
                  className="text-[10px] mt-0.5 opacity-80 leading-tight"
                  style={{
                    color: p.fg_color,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.copy_subtitle}
                </p>
              ) : null}
              <span
                className="mt-2 inline-block text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: p.accent_color, color: p.bg_color }}
              >
                {p.cta_label}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function monogram(brand: string): string {
  const cleaned = brand.replace(/[^a-zA-Z .]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·"
  );
}

function shade(hex: string, percent: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m || !m[1]) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
