"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LocationPicker({ salonId }: { salonId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [hasSaved, setHasSaved] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("salon_coords", { p_salon_id: salonId });
      const row = Array.isArray(data) ? data[0] : null;
      if (row && row.lat != null && row.lng != null) {
        setHasSaved({ lat: row.lat, lng: row.lng });
        setLat(String(row.lat));
        setLng(String(row.lng));
      }
    })();
  }, [supabase, salonId]);

  async function useDeviceLocation() {
    setError(null);
    setInfo(null);
    if (!navigator.geolocation) {
      setError("This browser doesn't support geolocation.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setInfo("Got it. Tap Save to apply.");
        setBusy(false);
      },
      (err) => {
        setError(err.message || "Couldn't get your location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save() {
    setError(null);
    setInfo(null);
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setError("Latitude and longitude must be numbers.");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError("Coordinates out of range.");
      return;
    }
    setBusy(true);
    const { error: e } = await supabase.rpc("set_salon_location", {
      p_salon_id: salonId,
      p_lat: latNum,
      p_lng: lngNum,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setHasSaved({ lat: latNum, lng: lngNum });
    setInfo("Saved. Customers within range now see you in the nearby list.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="skip-card p-6 sm:p-8 max-w-2xl">
      <h2 className="text-lg font-bold text-skip-ink">Location pin</h2>
      <p className="mt-1 text-sm text-skip-slate">
        Drops your salon on the map so SkipQ can sort the customer&apos;s nearby list.
        Sit inside the salon and tap &quot;Use my current location&quot; for the most accurate pin.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Latitude</span>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            inputMode="decimal"
            placeholder="9.9967"
            className="skip-input mt-2"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">Longitude</span>
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            inputMode="decimal"
            placeholder="76.2956"
            className="skip-input mt-2"
          />
        </label>
      </div>

      {hasSaved ? (
        <p className="mt-3 text-xs text-skip-stone">
          Currently saved: {hasSaved.lat.toFixed(5)}, {hasSaved.lng.toFixed(5)}
        </p>
      ) : (
        <p className="mt-3 text-xs text-skip-stone">No location set yet.</p>
      )}

      {error ? (
        <div className="mt-4 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{error}</p>
        </div>
      ) : null}
      {info ? (
        <div className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3" role="status">
          <p className="text-sm text-skip-success font-medium">{info}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-skip-stone/10">
        <button type="button" onClick={save} disabled={busy} className="skip-btn-primary">
          {busy ? "Saving…" : "Save location"}
        </button>
        <button type="button" onClick={useDeviceLocation} disabled={busy} className="skip-btn-secondary">
          Use my current location
        </button>
      </div>
    </div>
  );
}
