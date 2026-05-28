"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: string;
  name: string;
  category: string | null;
  price: number;
  default_duration: number;
}

interface Stylist {
  id: string;
  name: string;
  role: string | null;
  total_services: number;
  photo: string | null;
}

export function JoinForm({
  salonId,
  services,
  stylists,
  disabled = false,
}: {
  salonId: string;
  services: Service[];
  stylists: Stylist[];
  disabled?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const search = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore selections the user made before being asked to sign in.
  useEffect(() => {
    const preserved = search.get("services");
    if (preserved) {
      const ids = preserved.split(",").filter(Boolean);
      const valid = new Set(services.map((s) => s.id));
      setSelected(new Set(ids.filter((id) => valid.has(id))));
    }
    const presStylist = search.get("stylist");
    if (presStylist && stylists.some((s) => s.id === presStylist)) {
      setStylistId(presStylist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const total = useMemo(
    () =>
      services
        .filter((s) => selected.has(s.id))
        .reduce((acc, s) => acc + s.price, 0),
    [services, selected],
  );

  async function join() {
    setError(null);
    if (selected.size === 0) {
      setError("Pick at least one service.");
      return;
    }
    setBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      // Stash the user's selections in the URL so the booking sheet
      // can rebuild itself right after they sign in.
      const params = new URLSearchParams({
        next: `/c/salon/${salonId}`,
        services: Array.from(selected).join(","),
      });
      if (stylistId) params.set("stylist", stylistId);
      setBusy(false);
      router.push(`/c/login?${params.toString()}`);
      return;
    }
    const { error: rpcErr } = await supabase.rpc("queue_join", {
      p_salon_id: salonId,
      p_service_ids: Array.from(selected),
      p_preferred_stylist_id: stylistId ?? undefined,
    });
    setBusy(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    router.push("/c/bookings");
  }

  return (
    <div className="mt-3 space-y-2">
      {services.length === 0 ? (
        <p className="text-skip-stone text-sm">No services configured yet.</p>
      ) : (
        services.map((s) => {
          const on = selected.has(s.id);
          return (
            <label
              key={s.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition ${
                on
                  ? "bg-skip-accentLo border-skip-accent"
                  : "bg-white border-skip-stone/20 hover:border-skip-accent"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(s.id)}
                  className="h-5 w-5 accent-skip-accent"
                />
                <span>
                  <span className="font-semibold text-skip-ink">{s.name}</span>
                  <span className="text-xs text-skip-stone ml-2">
                    · {s.default_duration} min
                  </span>
                </span>
              </span>
              <span className="text-skip-ink font-extrabold">
                ₹{s.price.toFixed(0)}
              </span>
            </label>
          );
        })
      )}

      {stylists.length > 0 ? (
        <div className="pt-3">
          <p className="text-xs font-semibold text-skip-slate uppercase tracking-wide mb-2">
            Preferred stylist (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStylistId(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                stylistId === null
                  ? "bg-skip-ink text-white border-skip-ink"
                  : "bg-white text-skip-ink border-skip-stone/20"
              }`}
            >
              Any available
            </button>
            {stylists.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStylistId(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  stylistId === s.id
                    ? "bg-skip-ink text-white border-skip-ink"
                    : "bg-white text-skip-ink border-skip-stone/20"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{error}</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-skip-stone/10">
        <div>
          <p className="text-2xl font-extrabold text-skip-ink">₹{total.toFixed(0)}</p>
          <p className="text-xs text-skip-stone">
            {selected.size === 0 ? "No services" : `${selected.size} services`}
          </p>
        </div>
        <button
          type="button"
          onClick={join}
          disabled={busy || selected.size === 0 || disabled}
          className="skip-btn-primary disabled:opacity-50 disabled:cursor-not-allowed active:opacity-75"
        >
          {busy ? "Joining…" : disabled ? "Closed" : "Skip the queue"}
        </button>
      </div>
    </div>
  );
}
