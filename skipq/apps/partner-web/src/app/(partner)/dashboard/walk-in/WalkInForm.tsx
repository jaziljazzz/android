"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createWalkIn, type FormState } from "./actions";

interface Service {
  id: string;
  name: string;
  price: number;
  default_duration: number;
}

interface Stylist {
  id: string;
  name: string;
  role: string | null;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="skip-btn-primary inline-flex items-center gap-2">
      {pending ? (
        "Adding…"
      ) : (
        <>
          Skip the queue
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </>
      )}
    </button>
  );
}

export function WalkInForm({ services, stylists }: { services: Service[]; stylists: Stylist[] }) {
  const [state, action] = useFormState<FormState, FormData>(createWalkIn, undefined);
  const err = (key: string) => state?.fieldErrors?.[key];

  return (
    <form action={action} className="skip-card p-6 sm:p-8 space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Customer name" error={err("guest_name")}>
          <input
            name="guest_name"
            required
            className="skip-input"
            placeholder="Jazil S"
          />
        </Field>
        <Field label="Phone" error={err("guest_phone")}>
          <input
            name="guest_phone"
            type="tel"
            required
            className="skip-input"
            placeholder="+91 62826 40278"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold text-skip-slate uppercase tracking-wide">
          Services
        </legend>
        <div className="mt-2 space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-skip-stone">
              No active services. Add some under{" "}
              <Link className="text-skip-accent font-semibold" href="/dashboard/services">
                Services
              </Link>
              .
            </p>
          ) : (
            services.map((s) => (
              <label
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-skip-stone/20 bg-white px-4 py-3 cursor-pointer hover:border-skip-accent transition has-[:checked]:bg-skip-accentLo has-[:checked]:border-skip-accent"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="service_ids"
                    value={s.id}
                    className="h-5 w-5 accent-skip-accent"
                  />
                  <span>
                    <span className="font-semibold text-skip-ink">{s.name}</span>
                    <span className="text-xs text-skip-stone ml-2">· {s.default_duration} min</span>
                  </span>
                </span>
                <span className="text-skip-ink font-extrabold">
                  ₹{Number(s.price).toFixed(0)}
                </span>
              </label>
            ))
          )}
        </div>
        {err("service_ids") ? (
          <span className="text-xs text-skip-accent mt-1.5 block">{err("service_ids")}</span>
        ) : null}
      </fieldset>

      <Field label="Preferred stylist (optional)" error={err("preferred_stylist_id")}>
        <select name="preferred_stylist_id" defaultValue="" className="skip-input">
          <option value="">Any available</option>
          {stylists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.role ? ` · ${s.role}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes (optional)" error={err("notes")}>
        <textarea
          name="notes"
          rows={2}
          className="skip-input resize-none"
          placeholder="Anything the stylist should know"
        />
      </Field>

      {state?.error ? (
        <div className="rounded-xl bg-skip-accentLo border border-skip-accent/20 px-4 py-3" role="alert">
          <p className="text-sm text-skip-accent font-medium">{state.error}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-3 border-t border-skip-stone/10">
        <Submit />
        <Link href="/dashboard" className="text-sm font-medium text-skip-slate hover:text-skip-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-skip-slate uppercase tracking-wide">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <span className="text-xs text-skip-accent mt-1.5 block">{error}</span> : null}
    </label>
  );
}
