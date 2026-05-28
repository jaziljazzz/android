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
            className="shrink-0 w-[150px] rounded-2xl overflow-hidden shadow-card active:opacity-85"
            style={{
              background: p.bg_color,
              color: p.fg_color,
              scrollSnapAlign: "start",
            }}
          >
            <div className="relative w-full aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.media_url}
                alt={p.brand_name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent 40%, ${p.bg_color} 100%)`,
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
              <p className="text-[13px] font-extrabold leading-tight truncate mt-0.5">
                {p.copy_title}
              </p>
              {p.copy_subtitle ? (
                <p
                  className="text-[10px] mt-0.5 opacity-80 leading-tight truncate"
                  style={{ color: p.fg_color }}
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
