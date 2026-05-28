"use client";

import { useEffect, useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "nowait", label: "No wait" },
  { key: "top", label: "Top rated" },
  { key: "mens", label: "Men's" },
  { key: "ladies", label: "Ladies" },
  { key: "unisex", label: "Unisex" },
];

const PLACEHOLDER_HINTS = [
  "haircut",
  "beard trim",
  "hair colour",
  "head massage",
  "facial",
  "manicure",
  "keratin",
  "shave",
  "pedicure",
  "spa",
];

export function SearchAndFilters() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHintIndex((i) => (i + 1) % PLACEHOLDER_HINTS.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  // Filter the salon list client-side by toggling display on each <li>
  useEffect(() => {
    const items = document.querySelectorAll<HTMLLIElement>("[data-salon]");
    const q = query.trim().toLowerCase();
    items.forEach((el) => {
      const haystack = el.dataset.search ?? "";
      const type = el.dataset.type ?? "all";
      const nowait = el.dataset.nowait === "1";
      const rating = Number(el.dataset.rating ?? 0);
      let matchesFilter = true;
      if (filter === "nowait") matchesFilter = nowait;
      else if (filter === "top") matchesFilter = rating >= 4.5;
      else if (filter === "mens") matchesFilter = type === "mens" || type === "unisex";
      else if (filter === "ladies") matchesFilter = type === "ladies" || type === "unisex";
      else if (filter === "unisex") matchesFilter = type === "unisex";
      const matchesQuery = !q || haystack.includes(q);
      el.style.display = matchesFilter && matchesQuery ? "" : "none";
    });
  }, [query, filter]);

  return (
    <>
      <label className="block">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 h-12 border border-skip-stone/15 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-stone shrink-0">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <div className="relative flex-1 h-12">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search salons or services"
              className="absolute inset-0 w-full h-full bg-transparent outline-none text-skip-ink text-sm placeholder:text-transparent"
            />
            {!query ? (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center text-sm text-skip-stone pointer-events-none overflow-hidden select-none"
              >
                <span className="mr-1">Search</span>
                <div className="relative flex-1 h-5 overflow-hidden">
                  {PLACEHOLDER_HINTS.map((hint, i) => {
                    const offset = (i - hintIndex + PLACEHOLDER_HINTS.length) % PLACEHOLDER_HINTS.length;
                    let translate = "100%";
                    let opacity = 0;
                    if (offset === 0) {
                      translate = "0%";
                      opacity = 1;
                    } else if (offset === PLACEHOLDER_HINTS.length - 1) {
                      translate = "-100%";
                      opacity = 0;
                    }
                    return (
                      <span
                        key={hint}
                        className="absolute inset-0 flex items-center transition-all duration-500 ease-out"
                        style={{
                          transform: `translateY(${translate})`,
                          opacity,
                        }}
                      >
                        &ldquo;{hint}&rdquo;
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-skip-stone active:opacity-60"
              aria-label="Clear"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>
      </label>

      <div className="mt-4 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-hide">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(active ? "all" : f.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition active:opacity-60 ${
                active
                  ? "bg-skip-ink text-white border-skip-ink"
                  : "bg-white text-skip-slate border-skip-stone/20"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
