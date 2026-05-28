"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SavedLocation {
  place: string;
  sub?: string;
  lat?: number;
  lng?: number;
}

const DETECT_TRIED_KEY = "skipq_loc_detect_tried";

async function reverseGeocode(lat: number, lng: number): Promise<SavedLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: Record<string, string | undefined>;
    };
    const a = data.address ?? {};
    const place =
      a.suburb ??
      a.neighbourhood ??
      a.village ??
      a.town ??
      a.hamlet ??
      a.city_district ??
      a.city ??
      a.county ??
      "My location";
    const subParts = [
      a.suburb && a.suburb !== place ? a.suburb : null,
      a.city ?? a.town ?? a.village ?? null,
      a.state_district ?? a.county ?? null,
    ].filter((x): x is string => !!x && x !== place);
    return {
      place,
      sub: subParts.slice(0, 2).join(", ") || undefined,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export function LocationDetect({ hasLocation }: { hasLocation: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (hasLocation) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DETECT_TRIED_KEY)) return;
    if (!("geolocation" in navigator)) return;

    sessionStorage.setItem(DETECT_TRIED_KEY, "1");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const resolved = await reverseGeocode(latitude, longitude);
        const loc: SavedLocation = resolved ?? {
          place: "My location",
          lat: latitude,
          lng: longitude,
        };
        document.cookie = `skipq_loc=${encodeURIComponent(
          JSON.stringify(loc),
        )}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        router.refresh();
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, [hasLocation, router]);

  return null;
}
