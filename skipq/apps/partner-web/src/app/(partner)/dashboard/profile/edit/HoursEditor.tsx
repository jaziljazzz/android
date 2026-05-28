"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

type DayHours = { open: string; close: string } | null;
type HoursJson = Partial<Record<DayKey, DayHours>>;

type RowState = { closed: boolean; open: string; close: string };

function toRowState(value: DayHours | undefined): RowState {
  if (value === null) return { closed: true, open: "10:00", close: "20:00" };
  if (!value) return { closed: false, open: "10:00", close: "20:00" };
  return { closed: false, open: value.open || "10:00", close: value.close || "20:00" };
}

export function HoursEditor({
  salonId,
  initialHours,
}: {
  salonId: string;
  initialHours: HoursJson;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [rows, setRows] = useState<Record<DayKey, RowState>>(
    Object.fromEntries(DAYS.map((d) => [d.key, toRowState(initialHours[d.key])])) as Record<
      DayKey,
      RowState
    >,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function setRow(key: DayKey, partial: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
    setSaved(false);
  }

  function applyToAll() {
    const mon = rows.mon;
    setRows(
      Object.fromEntries(DAYS.map((d) => [d.key, { ...mon }])) as Record<DayKey, RowState>,
    );
    setSaved(false);
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const hours: HoursJson = {};
      for (const d of DAYS) {
        const r = rows[d.key];
        hours[d.key] = r.closed ? null : { open: r.open, close: r.close };
      }
      const { error: e } = await supabase
        .from("salons")
        .update({ hours: hours as never })
        .eq("id", salonId);
      if (e) throw e;
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="skip-card p-6 sm:p-8 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-skip-ink">Opening hours</h2>
          <p className="mt-1 text-sm text-skip-slate">
            Customers can&apos;t join the queue outside these hours. Times are local (Asia/Kolkata).
          </p>
        </div>
        <button
          type="button"
          onClick={applyToAll}
          className="text-xs font-bold uppercase tracking-wider text-skip-accent hover:underline shrink-0"
        >
          Apply Mon to all
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {DAYS.map(({ key, label }) => {
          const r = rows[key];
          return (
            <div
              key={key}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-skip-stone/15 px-3 py-2.5"
            >
              <span className="w-12 text-sm font-bold text-skip-ink">{label}</span>
              <label className="flex items-center gap-2 text-sm text-skip-slate">
                <input
                  type="checkbox"
                  checked={r.closed}
                  onChange={(e) => setRow(key, { closed: e.target.checked })}
                  className="accent-skip-accent"
                />
                Closed
              </label>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="time"
                  value={r.open}
                  disabled={r.closed}
                  onChange={(e) => setRow(key, { open: e.target.value })}
                  className="skip-input w-32 disabled:opacity-40"
                />
                <span className="text-skip-stone text-sm">to</span>
                <input
                  type="time"
                  value={r.close}
                  disabled={r.closed}
                  onChange={(e) => setRow(key, { close: e.target.value })}
                  className="skip-input w-32 disabled:opacity-40"
                />
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{error}</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-3 pt-4 border-t border-skip-stone/10">
        <button type="button" onClick={save} disabled={busy} className="skip-btn-primary">
          {busy ? "Saving…" : "Save hours"}
        </button>
        {saved ? (
          <span className="text-sm text-skip-success font-medium">Saved.</span>
        ) : null}
      </div>
    </div>
  );
}
