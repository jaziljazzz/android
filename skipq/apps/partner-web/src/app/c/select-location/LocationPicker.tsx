"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  place: string;
  sub?: string;
  lat?: number;
  lng?: number;
}

function readHistory(): Suggestion[] {
  if (typeof document === "undefined") return [];
  try {
    const raw = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("skipq_loc_history="))
      ?.split("=")[1];
    if (!raw) return [];
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is Suggestion => !!s && typeof s.place === "string");
  } catch {
    return [];
  }
}

function pushHistory(loc: Suggestion) {
  const prev = readHistory();
  const next = [loc, ...prev.filter((s) => s.place !== loc.place)].slice(0, 5);
  document.cookie = `skipq_loc_history=${encodeURIComponent(
    JSON.stringify(next),
  )}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function saveLocation(loc: Suggestion) {
  document.cookie = `skipq_loc=${encodeURIComponent(
    JSON.stringify(loc),
  )}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  pushHistory(loc);
}

async function reverseGeocode(lat: number, lng: number): Promise<Suggestion | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string | undefined> };
    const a = data.address ?? {};
    const place =
      a.suburb ??
      a.neighbourhood ??
      a.village ??
      a.town ??
      a.hamlet ??
      a.city_district ??
      a.city ??
      "My location";
    const sub = [a.city ?? a.town ?? a.village, a.state_district ?? a.county]
      .filter((x): x is string => !!x && x !== place)
      .slice(0, 2)
      .join(", ");
    return { place, sub: sub || undefined, lat, lng };
  } catch {
    return null;
  }
}

async function searchPlaces(query: string): Promise<Suggestion[]> {
  if (query.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + ", India",
      )}&format=json&limit=8&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: Record<string, string | undefined>;
    }>;
    return rows.map((r) => {
      const a = r.address ?? {};
      const place =
        a.suburb ??
        a.neighbourhood ??
        a.village ??
        a.town ??
        a.hamlet ??
        a.city_district ??
        a.city ??
        r.display_name.split(",")[0] ??
        "Location";
      const sub = r.display_name.split(",").slice(1, 3).join(",").trim();
      return {
        place,
        sub: sub || undefined,
        lat: Number(r.lat),
        lng: Number(r.lon),
      };
    });
  } catch {
    return [];
  }
}

export function LocationPicker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<Suggestion[]>([]);
  const [detected, setDetected] = useState<Suggestion | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const rows = await searchPlaces(query);
      setSuggestions(rows);
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  async function detectMyLocation() {
    if (!("geolocation" in navigator)) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setDetected(
          resolved ?? {
            place: "My location",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        );
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  useEffect(() => {
    void detectMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(loc: Suggestion) {
    if (busy) return;
    setBusy(true);
    saveLocation(loc);
    router.push("/c/home");
    router.refresh();
  }

  return (
    <main className="max-w-3xl mx-auto px-5 py-5 min-h-screen">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 -ml-2 flex items-center justify-center active:opacity-60"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-skip-ink">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <h1 className="text-2xl font-extrabold text-skip-ink">Select a location</h1>
      </div>

      <label className="block mt-5">
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 h-12 border border-skip-stone/15 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-accent shrink-0">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for area, street name…"
            className="flex-1 bg-transparent outline-none text-skip-ink text-sm placeholder:text-skip-stone"
            autoFocus
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

      {query.trim().length >= 3 ? (
        <ul className="mt-4 bg-white rounded-xl overflow-hidden border border-skip-stone/10">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-skip-stone">Searching…</li>
          ) : (
            suggestions.map((s, i) => (
              <li key={i} className="border-t border-skip-stone/10 first:border-t-0">
                <button
                  type="button"
                  onClick={() => pick(s)}
                  disabled={busy}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left active:bg-skip-mist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-stone mt-0.5 shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-semibold text-skip-ink truncate">{s.place}</p>
                    {s.sub ? (
                      <p className="text-xs text-skip-stone truncate">{s.sub}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <section className="mt-4 bg-white rounded-xl overflow-hidden border border-skip-stone/10">
          <button
            type="button"
            onClick={detectMyLocation}
            disabled={detecting || busy}
            className="w-full px-4 py-4 flex items-start gap-3 text-left active:bg-skip-mist"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-accent shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-skip-accent">
                {detecting ? "Detecting…" : "Use your current location"}
              </p>
              {detected?.place ? (
                <p
                  className="text-sm text-skip-slate truncate cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (detected) pick(detected);
                  }}
                >
                  {detected.place}
                  {detected.sub ? `, ${detected.sub}` : ""}
                </p>
              ) : (
                <p className="text-xs text-skip-stone">
                  We&apos;ll sort salons by distance from where you are
                </p>
              )}
            </div>
          </button>
        </section>
      )}

      {history.length > 0 && query.trim().length < 3 ? (
        <>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] font-bold text-skip-stone text-center">
            Recent locations
          </p>
          <ul className="mt-3 bg-white rounded-xl overflow-hidden border border-skip-stone/10">
            {history.map((s, i) => (
              <li key={i} className="border-t border-skip-stone/10 first:border-t-0">
                <button
                  type="button"
                  onClick={() => pick(s)}
                  disabled={busy}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left active:bg-skip-mist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-skip-stone mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-bold text-skip-ink truncate">{s.place}</p>
                    {s.sub ? (
                      <p className="text-xs text-skip-stone truncate">{s.sub}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-8 text-center text-[10px] text-skip-stone">
        powered by OpenStreetMap
      </p>
    </main>
  );
}
