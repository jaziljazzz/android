"use client";

import { useEffect, useRef, useState } from "react";
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

export function BrandVideo({ placement }: { placement: Placement }) {
  const ref = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [seenImpression, setSeenImpression] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ref.current?.play().catch(() => {});
            if (!seenImpression) {
              setSeenImpression(true);
              trackEvent(placement.id, "impression");
            }
          } else {
            ref.current?.pause();
          }
        }
      },
      { threshold: 0.4 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [placement.id, seenImpression]);

  return (
    <section ref={sectionRef} className="mt-6 -mx-5 px-5">
      <a
        href={placement.cta_url ?? "#"}
        onClick={() => trackEvent(placement.id, "click")}
        className="relative block rounded-3xl overflow-hidden shadow-card active:opacity-95"
        style={{ background: placement.bg_color, color: placement.fg_color }}
      >
        <div className="relative aspect-[16/10] bg-black">
          <video
            ref={ref}
            src={placement.media_url}
            poster={placement.media_poster_url ?? undefined}
            muted={muted}
            playsInline
            loop
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className="text-[10px] tracking-[0.18em] font-bold px-2 py-0.5 rounded"
              style={{ background: placement.accent_color, color: placement.bg_color }}
            >
              AD
            </span>
            {placement.copy_eyebrow ? (
              <span className="text-[10px] tracking-[0.22em] font-bold text-white/90 bg-black/40 backdrop-blur px-2 py-0.5 rounded">
                {placement.copy_eyebrow}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMuted((m) => !m);
              if (ref.current) ref.current.muted = !ref.current.muted;
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/55 backdrop-blur text-white flex items-center justify-center active:scale-95"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          {!playing ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: placement.accent_color }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={placement.bg_color}>
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </span>
            </div>
          ) : null}

          <div className="absolute left-4 right-4 bottom-3 z-10">
            <h2 className="text-white text-lg font-extrabold leading-tight">
              {placement.copy_title}
            </h2>
            {placement.copy_subtitle ? (
              <p className="text-white/85 text-[12px] mt-1 leading-snug">
                {placement.copy_subtitle}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/80">
                {placement.brand_name}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: placement.accent_color, color: placement.bg_color }}
              >
                {placement.cta_label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}
