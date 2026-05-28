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
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-skip-accent text-white font-semibold px-5 py-2.5 hover:bg-skip-accentHi transition disabled:opacity-60"
    >
      {pending ? "Adding…" : "Skip the queue"}
    </button>
  );
}

export function WalkInForm({ services, stylists }: { services: Service[]; stylists: Stylist[] }) {
  const [state, action] = useFormState<FormState, FormData>(createWalkIn, undefined);
  const err = (key: string) => state?.fieldErrors?.[key];

  return (
    <form action={action} className="space-y-4 max-w-lg">
      <Field label="Customer name" error={err("guest_name")}>
        <input
          name="guest_name"
          required
          className="input"
          placeholder="Jazil S"
        />
      </Field>

      <Field label="Phone" error={err("guest_phone")}>
        <input
          name="guest_phone"
          type="tel"
          required
          className="input"
          placeholder="+91XXXXXXXXXX"
        />
      </Field>

      <fieldset>
        <legend className="text-xs font-semibold text-skip-slate">Services</legend>
        <div className="mt-2 space-y-1">
          {services.length === 0 ? (
            <p className="text-sm text-skip-stone">
              No active services. Add some under <Link className="text-skip-accent" href="/dashboard/services">Services</Link>.
            </p>
          ) : (
            services.map((s) => (
              <label
                key={s.id}
                className="flex items-center justify-between bg-white border border-skip-stone/15 rounded-lg px-3 py-2"
              >
                <span className="flex items-center gap-2 text-skip-slate">
                  <input
                    type="checkbox"
                    name="service_ids"
                    value={s.id}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-skip-ink">{s.name}</span>
                  <span className="text-xs text-skip-stone">· {s.default_duration} min</span>
                </span>
                <span className="text-skip-ink font-semibold">
                  ₹{Number(s.price).toFixed(0)}
                </span>
              </label>
            ))
          )}
        </div>
        {err("service_ids") ? (
          <span className="text-xs text-red-600 mt-1 block">{err("service_ids")}</span>
        ) : null}
      </fieldset>

      <Field label="Preferred stylist (optional)" error={err("preferred_stylist_id")}>
        <select name="preferred_stylist_id" defaultValue="" className="input">
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
          className="input"
          placeholder="Anything the stylist should know"
        />
      </Field>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Submit />
        <Link href="/dashboard" className="text-sm text-skip-stone hover:text-skip-ink">
          Cancel
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(107 114 128 / 0.3);
          background: white;
          padding: 0.625rem 0.75rem;
          color: #0E1116;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #0F8B8D;
        }
      `}</style>
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
      <span className="text-xs font-semibold text-skip-slate">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="text-xs text-red-600 mt-1 block">{error}</span> : null}
    </label>
  );
}
