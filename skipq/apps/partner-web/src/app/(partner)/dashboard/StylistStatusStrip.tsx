"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "available" | "busy" | "break" | "off";
const ORDER: Status[] = ["available", "busy", "break", "off"];

const LABEL: Record<Status, string> = {
  available: "Available",
  busy: "Busy",
  break: "On break",
  off: "Off duty",
};

const TONE: Record<Status, string> = {
  available: "bg-skip-successLo text-skip-success",
  busy: "bg-skip-accentLo text-skip-accent",
  break: "bg-skip-cautionLo text-skip-caution",
  off: "bg-skip-mist text-skip-stone",
};

interface Stylist {
  id: string;
  name: string;
  status: Status;
}

export function StylistStatusStrip({ salonId }: { salonId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function load() {
    const { data } = await supabase
      .from("stylists")
      .select("id, name, status")
      .eq("salon_id", salonId)
      .order("name");
    setStylists((data ?? []) as Stylist[]);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  async function cycle(s: Stylist) {
    const next = ORDER[(ORDER.indexOf(s.status) + 1) % ORDER.length] as Status;
    setPending(s.id);
    setStylists((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    const { error } = await supabase
      .from("stylists")
      .update({ status: next })
      .eq("id", s.id);
    setPending(null);
    if (error) {
      setStylists((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: s.status } : x)));
      return;
    }
    startTransition(() => router.refresh());
  }

  if (stylists.length === 0) return null;

  return (
    <section className="mt-6 skip-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-skip-ink">Stylists today</h2>
        <span className="text-[10px] uppercase tracking-wider text-skip-stone font-semibold">
          Tap to change
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {stylists.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => cycle(s)}
            disabled={pending === s.id}
            className={`inline-flex items-center gap-2 rounded-full pl-3 pr-2 py-1 text-sm font-medium border transition ${
              s.status === "off"
                ? "border-skip-stone/20 text-skip-stone"
                : "border-skip-stone/15 text-skip-ink hover:border-skip-accent/30"
            } ${pending === s.id ? "opacity-50" : ""}`}
          >
            <span className={s.status === "off" ? "line-through" : ""}>{s.name}</span>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${TONE[s.status]}`}>
              {LABEL[s.status]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
