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
  const next = [loc, ...prev.filter((s) => s.place !== loc.place)].slice(0, 8);
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

function removeHistory(place: string): Suggestion[] {
  const next = readHistory().filter((s) => s.place !== place);
  document.cookie = `skipq_loc_history=${encodeURIComponent(
    JSON.stringify(next),
  )}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  return next;
}

function haversine(a: Suggestion, b: Suggestion): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function distanceLabel(km: number | null): string {
  if (km == null) return "";
  if (km < 1) return "0 m";
  return `${km} km`;
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

  function useDetected() {
    if (!detected) {
      void detectMyLocation();
      return;
    }
    pick(detected);
  }

  function onRemove(place: string) {
    setHistory(removeHistory(place));
  }

  const isSearching = query.trim().length >= 3;

  return (
    <main className="min-h-screen bg-skip-mist pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-skip-mist px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-3 active:opacity-60"
          aria-label="Close"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-skip-ink"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h1 className="text-[22px] font-extrabold text-skip-ink">
            Select a location
          </h1>
        </button>
      </header>

      {/* Search bar */}
      <div className="px-5">
        <label className="block">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 h-14 border border-skip-stone/10 shadow-sm">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-skip-accent shrink-0"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for area, street name…"
              className="flex-1 bg-transparent outline-none text-skip-ink placeholder:text-skip-stone"
              autoFocus
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-skip-stone active:opacity-60"
                aria-label="Clear"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>
        </label>
      </div>

      {/* Search results */}
      {isSearching ? (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl overflow-hidden">
            {suggestions.length === 0 ? (
              <div className="px-4 py-5 text-sm text-skip-stone text-center">
                Searching…
              </div>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={`${s.place}-${i}`}
                  type="button"
                  onClick={() => pick(s)}
                  disabled={busy}
                  className="w-full px-4 py-3.5 flex items-start gap-3 text-left active:bg-skip-mist border-t border-skip-stone/10 first:border-t-0"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-skip-stone mt-0.5 shrink-0"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-semibold text-skip-ink truncate">
                      {s.place}
                    </p>
                    {s.sub ? (
                      <p className="text-xs text-skip-stone truncate mt-0.5">
                        {s.sub}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Quick actions card */}
          <div className="px-5 mt-4">
            <div className="bg-white rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={useDetected}
                disabled={detecting || busy}
                className="w-full px-4 py-4 flex items-start gap-3 text-left active:bg-skip-mist"
              >
                <span className="shrink-0 mt-0.5 text-skip-accent">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-skip-accent text-[15px]">
                    {detecting ? "Detecting your location…" : "Use current location"}
                  </p>
                  {detected ? (
                    <p className="text-[13px] text-skip-slate mt-0.5 leading-snug">
                      {detected.place}
                      {detected.sub ? `, ${detected.sub}` : ""}
                    </p>
                  ) : (
                    <p className="text-[12px] text-skip-stone mt-0.5">
                      We&apos;ll sort salons by distance
                    </p>
                  )}
                </div>
                <ChevronRight />
              </button>

              <div className="border-t border-skip-stone/10" />

              <button
                type="button"
                onClick={() => router.push("/c/account")}
                className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-skip-mist"
              >
                <span className="shrink-0 text-skip-accent">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <p className="flex-1 font-bold text-skip-accent text-[15px]">
                  Add Address
                </p>
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Saved / recent addresses */}
          {history.length > 0 ? (
            <div className="mt-6">
              <h2 className="px-5 text-[11px] font-bold uppercase tracking-[0.22em] text-skip-stone">
                Saved addresses
              </h2>
              <div className="mt-3 space-y-2.5 px-5">
                {history.map((s, i) => {
                  const km = detected ? haversine(detected, s) : null;
                  return (
                    <article
                      key={`${s.place}-${i}`}
                      className="bg-white rounded-2xl px-4 py-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => pick(s)}
                        disabled={busy}
                        className="w-full text-left flex items-start gap-3 active:opacity-80"
                      >
                        <div className="shrink-0 flex flex-col items-center w-12">
                          <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-skip-ink"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          {km != null ? (
                            <span className="mt-1 text-[10px] font-semibold text-skip-stone">
                              {distanceLabel(km)}
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-skip-ink truncate">
                            {s.place}
                          </p>
                          {s.sub ? (
                            <p className="text-[13px] text-skip-slate leading-snug mt-0.5">
                              {s.sub}
                            </p>
                          ) : null}
                        </div>
                      </button>
                      <div className="mt-3 ml-[60px] flex items-center gap-2">
                        <RoundIconButton
                          ariaLabel="Remove"
                          onClick={() => onRemove(s.place)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="5" cy="12" r="1.4" />
                            <circle cx="12" cy="12" r="1.4" />
                            <circle cx="19" cy="12" r="1.4" />
                          </svg>
                        </RoundIconButton>
                        <RoundIconButton
                          ariaLabel="Share"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.share) {
                              void navigator.share({
                                title: s.place,
                                text: `${s.place}${s.sub ? `, ${s.sub}` : ""}`,
                              });
                            }
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="5 12 19 5 14 19 12 13 5 12" />
                          </svg>
                        </RoundIconButton>
                        <RoundIconButton
                          ariaLabel="Use this"
                          onClick={() => pick(s)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </RoundIconButton>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-[10px] text-skip-stone">
            powered by OpenStreetMap
          </p>
        </>
      )}
    </main>
  );
}

function ChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-skip-stone shrink-0 mt-1"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RoundIconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-9 h-9 rounded-full border border-skip-stone/20 flex items-center justify-center text-skip-accent active:scale-95 active:bg-skip-mist"
    >
      {children}
    </button>
  );
}
