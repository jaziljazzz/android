"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SUGGESTIONS = [
  "No wait right now — walk in for a haircut.",
  "Senior stylist Arjun is free for the next hour.",
  "Chair open for a beard trim. Pop in!",
];

export function BlastForm({
  onCooldown,
  nextAllowedAt,
}: {
  onCooldown: boolean;
  nextAllowedAt: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [message, setMessage] = useState(SUGGESTIONS[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);
  const [, startTransition] = useTransition();

  async function send() {
    setError(null);
    setSuccess(null);
    if (!message.trim()) {
      setError("Type a message first.");
      return;
    }
    setBusy(true);
    const { data, error: rpcErr } = await supabase.rpc("send_empty_chair_blast", {
      p_message: message.trim(),
    });
    setBusy(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setSuccess({ count: row?.recipient_count ?? 0 });
    startTransition(() => router.refresh());
  }

  return (
    <section className="mt-6">
      <div className="skip-card p-6 sm:p-8 max-w-2xl">
        {onCooldown && nextAllowedAt ? (
          <div className="mb-4 rounded-xl bg-skip-cautionLo border border-skip-caution/20 px-4 py-3" role="status">
            <p className="text-sm text-skip-caution font-medium">
              Next blast available at{" "}
              {new Date(nextAllowedAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
              . One per six hours.
            </p>
          </div>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
            Message ({message.length}/160)
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 160))}
            rows={3}
            className="skip-input mt-2 resize-none"
            placeholder="What's the offer right now?"
            disabled={onCooldown || busy}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setMessage(s)}
              disabled={onCooldown || busy}
              className="text-xs text-skip-slate hover:text-skip-accent border border-skip-stone/20 rounded-full px-3 py-1"
            >
              {s}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
            <p className="text-sm text-skip-accent font-medium">{error}</p>
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-xl bg-skip-successLo border border-skip-success/20 px-4 py-3" role="status">
            <p className="text-sm text-skip-success font-medium">
              Blast sent to {success.count} customer{success.count === 1 ? "" : "s"}.
            </p>
          </div>
        ) : null}

        <div className="mt-5 pt-4 border-t border-skip-stone/10">
          <button
            type="button"
            onClick={send}
            disabled={busy || onCooldown}
            className="skip-btn-primary"
          >
            {busy ? "Sending…" : "Send blast"}
          </button>
        </div>
      </div>
    </section>
  );
}
