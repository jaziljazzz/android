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

export function SearchAndFilters() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for salons or area"
            className="flex-1 bg-transparent outline-none text-skip-ink text-sm placeholder:text-skip-stone"
          />
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
