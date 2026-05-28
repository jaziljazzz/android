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

export function BrandHero({ placements }: { placements: Placement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  // Set when *we* trigger a scrollTo so we ignore the scroll events it fires.
  const programmaticScrollRef = useRef(false);
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrollingRef = useRef(false);
  const userScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = placements;
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => {
      // Don't auto-advance while the user is interacting with the carousel.
      if (userScrollingRef.current) return;
      setIndex((i) => (i + 1) % count);
    }, 4200);
    return () => clearInterval(t);
  }, [count, paused]);

  useEffect(() => {
    const current = slides[index];
    if (!current || seenRef.current.has(current.id)) return;
    seenRef.current.add(current.id);
    trackEvent(current.id, "impression");
  }, [index, slides]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    const target = index * width;
    // Already at the right slide (e.g. index was just updated *from* a manual
    // scroll) — don't fire another scrollTo, that's what doubled the swipe.
    if (Math.abs(el.scrollLeft - target) < 8) return;
    programmaticScrollRef.current = true;
    if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    scrollSettleTimerRef.current = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 450);
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [index]);

  if (!count) return null;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    // Ignore scroll events fired by our own scrollTo.
    if (programmaticScrollRef.current) return;
    const w = el.clientWidth;
    if (!w) return;
    userScrollingRef.current = true;
    if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
    userScrollTimerRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 350);
    const next = Math.round(el.scrollLeft / w);
    if (next !== index && next >= 0 && next < count) setIndex(next);
  };

  return (
    <section
      className="mt-4 -mx-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{
          scrollSnapType: "x mandatory",
          touchAction: "pan-x pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {slides.map((p) => (
          <article
            key={p.id}
            className="shrink-0 w-full snap-start px-5"
            style={{
              scrollSnapAlign: "start",
              // Force one-slide-per-swipe: the browser can't carry momentum
              // past a snap point, so a hard swipe still advances by 1.
              scrollSnapStop: "always",
            }}
          >
            <a
              href={p.cta_url ?? "#"}
              onClick={() => trackEvent(p.id, "click")}
              className="relative block rounded-3xl overflow-hidden shadow-card active:opacity-90 transition"
              style={{
                background: `linear-gradient(135deg, ${p.bg_color} 0%, ${shade(p.bg_color, -22)} 100%)`,
                color: p.fg_color,
                minHeight: 188,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.media_url}
                alt=""
                loading="lazy"
                className="absolute right-0 top-0 h-full w-[55%] object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${p.bg_color} 35%, ${hexAlpha(p.bg_color, 0.6)} 60%, transparent 100%)`,
                }}
              />
              <span
                aria-hidden
                className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-25 pointer-events-none mix-blend-screen"
                style={{
                  background: `radial-gradient(circle, ${p.accent_color} 0%, transparent 70%)`,
                }}
              />

              <div className="relative p-5 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] tracking-[0.18em] font-bold px-2 py-0.5 rounded"
                    style={{
                      background: p.accent_color,
                      color: p.bg_color,
                    }}
                  >
                    AD
                  </span>
                  {p.copy_eyebrow ? (
                    <span
                      className="text-[10px] tracking-[0.22em] font-bold opacity-80"
                      style={{ color: p.fg_color }}
                    >
                      {p.copy_eyebrow}
                    </span>
                  ) : null}
                </div>
                <h2
                  className="text-[22px] font-extrabold leading-[1.1] max-w-[80%]"
                  style={{ color: p.fg_color }}
                >
                  {p.copy_title}
                </h2>
                {p.copy_subtitle ? (
                  <p
                    className="text-[12px] opacity-85 max-w-[78%] leading-snug"
                    style={{ color: p.fg_color }}
                  >
                    {p.copy_subtitle}
                  </p>
                ) : null}
                <div className="mt-3">
                  <span
                    className="inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: p.accent_color,
                      color: p.bg_color,
                    }}
                  >
                    {p.cta_label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                background:
                  i === index ? "var(--skip-ink, #0f172a)" : "rgba(15,23,42,0.25)",
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m || !m[1]) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
